import { useEffect, useRef } from 'react';
import {
  RealtimeKitProvider,
  useRealtimeKitClient,
  useRealtimeKitMeeting,
} from '@cloudflare/realtimekit-react';
import { RtkDialogManager, RtkUiProvider } from '@cloudflare/realtimekit-react-ui';
import CustomRtkMeeting from './components/custom-rtk-meeting';
import { useStatesStore } from './store';

type Meeting = ReturnType<typeof useRealtimeKitClient>[0];

function useParticipantSpatialAudio(meeting: Meeting) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef(new Map<string, { track: MediaStreamTrack; source: MediaStreamAudioSourceNode; panner: PannerNode }>());
  const participantAudioListenersRef = useRef(new Map<string, () => void>());
  const orbitTimerRef = useRef<number | undefined>(0);

  // Shared helper to drop a participant from our graph.
  const removeParticipantNode = (participantId: string) => {
    console.log('[spatial] removing participant node', participantId);
    const node = nodesRef.current.get(participantId);
    if (node) {
      node.source.disconnect();
      node.panner.disconnect();
      nodesRef.current.delete(participantId);
    }
    const off = participantAudioListenersRef.current.get(participantId);
    off?.();
    participantAudioListenersRef.current.delete(participantId);
  };

  useEffect(() => {
    if (!meeting) return;

    const audioCtx = audioCtxRef.current ?? new AudioContext();
    audioCtxRef.current = audioCtx;
    console.log('[spatial] audio context ready', audioCtx.state);

    const upsertNode = (participantId: string, track?: MediaStreamTrack) => {
      console.log('[spatial] upsertNode', participantId, !!track);
      if (!track) {
        // removeParticipantNode(participantId);
        return;
      }

      const existing = nodesRef.current.get(participantId);
      if (existing?.track === track) return;

      // Disable default playback for this participant to avoid double audio.
      // meeting.audio?.removeParticipantTrack?.(participantId);
      if(track) {
        meeting.audio?.removeTrack?.(track.id);
        meeting.audio?.removeParticipantTrack(participantId);
      }

      // return;

      const stream = new MediaStream([track]);
      const source = audioCtx.createMediaStreamSource(stream);
      const panner = audioCtx.createPanner();
      panner.panningModel = 'HRTF';
      panner.distanceModel = 'inverse';
      panner.refDistance = 1;
      panner.maxDistance = 100;
      panner.rolloffFactor = 1;
      source.connect(panner).connect(audioCtx.destination);
      // source.connect(audioCtx.destination);

      console.log(audioCtx)

      nodesRef.current.set(participantId, { track, source, panner });
      console.log('[spatial] attached participant audio', participantId, {
        nodes: nodesRef.current.size,
      });

    };

    const attachParticipant = (participant: any) => {
      if (!participant || participant.id === meeting.self?.id) return;

      console.log('[spatial] attaching participant listener', participant.id);

      const onAudioUpdate = ({ audioTrack }: { audioTrack: MediaStreamTrack }) => {
        console.log('[spatial] audioUpdate received', participant.id, !!audioTrack);
        upsertNode(participant.id, audioTrack);
      };

      participant.on?.('audioUpdate', onAudioUpdate);
      participantAudioListenersRef.current.set(participant.id, () => participant.off?.('audioUpdate', onAudioUpdate));

      upsertNode(participant.id, participant.audioTrack);
    };

    const joined = meeting.participants?.joined;
    console.log('[spatial] initial participants', joined?.size);
    joined?.forEach((participant: any) => attachParticipant(participant));

    const onJoined = (participant: any) => attachParticipant(participant);
    const onLeft = (participant: any) => {
      console.log('[spatial] participant left', participant.id);
      return removeParticipantNode(participant?.id);
    }
    const onCleared = () => {
      Array.from(nodesRef.current.keys()).forEach(removeParticipantNode);
      console.log('[spatial] participants cleared');
    };

    joined?.on?.('participantJoined', onJoined);
    joined?.on?.('participantLeft', onLeft);
    joined?.on?.('participantsCleared', onCleared);

    return () => {
      joined?.off?.('participantJoined', onJoined);
      joined?.off?.('participantLeft', onLeft);
      joined?.off?.('participantsCleared', onCleared);
      Array.from(nodesRef.current.keys()).forEach(removeParticipantNode);
      console.log('[spatial] teardown');
    };
  }, [meeting]);

  // Animate spatial positions in a shared interval.
  useEffect(() => {
    let cancelled = false;
    let retryTimer: number | undefined;

    const startOrbit = () => {
      const audioCtx = audioCtxRef.current;
      if (!audioCtx) {
        console.log('[spatial] cannot start orbit loop; missing audio context');
        if (!cancelled) {
          retryTimer = window.setTimeout(startOrbit, 200);
        }
        return;
      }

      let angle = 0;
      const radius = 50;
      const step = 0.02;
      const tickMs = 50;

      console.log('[spatial] starting orbit loop');
      orbitTimerRef.current = window.setInterval(() => {
        console.log( "[spatial] number of nodes:", nodesRef.current.entries().toArray().length);
        const ordered = Array.from(nodesRef.current.entries()).sort(([idA], [idB]) =>
          idA.localeCompare(idB)
        );

        ordered.forEach(([_, { panner }], idx) => {
          const phase = (idx / Math.max(1, ordered.length)) * Math.PI * 2;
          const theta = angle + phase;
          panner.positionX.setValueAtTime(Math.cos(theta) * radius, audioCtx.currentTime);
          panner.positionZ.setValueAtTime(Math.sin(theta) * radius * 0.02, audioCtx.currentTime);
          // console.log('[spatial] updated position', idx, panner.positionX.value, audioCtx.currentTime)
        });

        angle = (angle + step) % (Math.PI * 2);
      }, tickMs);
    };

    startOrbit();

    return () => {
      cancelled = true;
      if (orbitTimerRef.current) {
        window.clearInterval(orbitTimerRef.current);
      }
      if (retryTimer) {
        window.clearTimeout(retryTimer);
      }
      console.log('[spatial] stopped orbit loop');
    };
  }, []);
}

function Meeting() {
  const { meeting } = useRealtimeKitMeeting();

  useEffect(() => {
    if (meeting) {
      /**
       * NOTE(ravindra-dyte):
       * During development phase, make sure to expose meeting object to window,
       * for debugging purposes.
       */
      Object.assign(window, {
        meeting,
      });
    }
  }, [meeting]);

  return <CustomRtkMeeting />;
}

function App() {
  const [meeting, initMeeting] = useRealtimeKitClient();
  const setStates = useStatesStore((s) => s.setStates);

  useEffect(() => {
    async function initalizeMeeting() {
      const searchParams = new URL(window.location.href).searchParams;

      const authToken = searchParams.get('authToken');

      if (!authToken) {
        alert(
          "An authToken wasn't passed, please pass an authToken in the URL query to join a meeting.",
        );
        return;
      }

      initMeeting({
        authToken,
        defaults: {
          audio: false,
          video: false,
        },
        modules:{experimentalAudioPlayback: true}
      });
    }

    if (!meeting) {
      initalizeMeeting();
    }
  }, [meeting]);

  useParticipantSpatialAudio(meeting);

  // By default this component will cover the entire viewport.
  // To avoid that and to make it fill a parent container, pass the prop:
  // `mode="fill"` to the component.
  return (
    <RealtimeKitProvider value={meeting}>
      <RtkUiProvider
        meeting={meeting}
        onRtkStatesUpdate={(e) => {
          setStates(e.detail);
        }}
        showSetupScreen
        style={{ height: '100%', width: '100%', display: 'block' }}
      >
        <Meeting />
        <RtkDialogManager />
      </RtkUiProvider>
    </RealtimeKitProvider>
  );
}

export default App;
