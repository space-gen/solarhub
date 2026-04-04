import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  LayoutChangeEvent,
  PanResponder,
  PanResponderGestureState,
  PanResponderInstance,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Canvas from 'react-native-canvas';
import { Picker } from '@react-native-picker/picker';

export type TaskType =
  | 'sunspot'
  | 'solar_flare'
  | 'magnetogram'
  | 'coronal_hole'
  | 'prominence'
  | 'active_region'
  | 'cme';

export type UserLabel =
  | 'class_a' | 'class_b' | 'class_c' | 'class_d' | 'class_e' | 'class_f' | 'class_h' | 'none'
  | 'x_class' | 'm_class' | 'c_class' | 'b_class' | 'a_class'
  | 'alpha' | 'beta' | 'gamma' | 'beta-gamma' | 'delta' | 'beta-delta' | 'beta-gamma-delta' | 'gamma-delta'
  | 'polar' | 'equatorial' | 'mid-latitude' | 'transequatorial'
  | 'quiescent' | 'active' | 'eruptive' | 'intermediate'
  | 'full_halo' | 'partial_halo' | 'normal' | 'narrow';

type Spot = { x: number; y: number; xPct: number; yPct: number };

type SubmitPayload = {
  task_type: TaskType;
  user_label: UserLabel;
  confidence: number;
  comments: string;
  pixel_coords: Array<{ x: number; y: number }>;
  pixel_labels: Array<UserLabel | null>;
  pixel_radii: number[];
};

export interface AnnotationPanelNativeProps {
  taskType: TaskType;
  imageUrl: string;
  onSubmit: (payload: SubmitPayload) => Promise<void> | void;
}

const DEFAULT_RADIUS = 5;
const MAX_RADIUS = 300;

const TASK_LABELS: Record<TaskType, UserLabel[]> = {
  sunspot: ['class_a', 'class_b', 'class_c', 'class_d', 'class_e', 'class_f', 'class_h', 'none'],
  solar_flare: ['x_class', 'm_class', 'c_class', 'b_class', 'a_class', 'none'],
  magnetogram: ['alpha', 'beta', 'gamma', 'beta-gamma', 'delta', 'beta-delta', 'beta-gamma-delta', 'gamma-delta', 'none'],
  coronal_hole: ['polar', 'equatorial', 'mid-latitude', 'transequatorial', 'none'],
  prominence: ['quiescent', 'active', 'eruptive', 'intermediate', 'none'],
  active_region: ['alpha', 'beta', 'gamma', 'beta-gamma', 'beta-gamma-delta', 'none'],
  cme: ['full_halo', 'partial_halo', 'normal', 'narrow', 'none'],
};

function clamp01(value: number): number {
  return Math.min(Math.max(value, 0), 1);
}

function mapPointToCanonical(x: number, y: number, width: number, height: number): Spot {
  const xPct = clamp01(x / width);
  const yPct = clamp01(y / height);
  // Keep canonical coordinate scaling exactly aligned with the web component.
  const x1024 = Math.round(xPct * 1024);
  const y1024 = Math.round(yPct * 1024);
  return { x: x1024, y: y1024, xPct, yPct };
}

function distance(aX: number, aY: number, bX: number, bY: number): number {
  return Math.hypot(aX - bX, aY - bY);
}

export default function AnnotationPanelNative({
  taskType,
  imageUrl,
  onSubmit,
}: AnnotationPanelNativeProps) {
  const [spots, setSpots] = useState<Spot[]>([]);
  const [spotLabels, setSpotLabels] = useState<Array<UserLabel | null>>([]);
  const [spotRadii, setSpotRadii] = useState<number[]>([]);
  const [activeSpotIndex, setActiveSpotIndex] = useState<number | null>(null);
  const [isNone, setIsNone] = useState(false);
  const [confidence, setConfidence] = useState(75);
  const [comments, setComments] = useState('');
  const [layout, setLayout] = useState({ width: 1, height: 1 });
  const [submitting, setSubmitting] = useState(false);

  const canvasRef = useRef<Canvas | null>(null);
  const panStartRef = useRef<{ x: number; y: number } | null>(null);
  const resizeRef = useRef<{ index: number; centerX: number; centerY: number } | null>(null);
  const movedRef = useRef(false);

  const labelsForTask = TASK_LABELS[taskType];
  const hasAllLabels = spotLabels.length > 0 && spotLabels.every(Boolean);
  const canSubmit = (isNone || hasAllLabels) && !submitting;

  const drawOverlay = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = layout.width;
    canvas.height = layout.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, layout.width, layout.height);
    spots.forEach((spot, idx) => {
      const radiusPx = ((spotRadii[idx] ?? DEFAULT_RADIUS) / 1024) * layout.width;
      const cx = spot.xPct * layout.width;
      const cy = spot.yPct * layout.height;
      const isActive = idx === activeSpotIndex;

      ctx.beginPath();
      ctx.arc(cx, cy, radiusPx, 0, Math.PI * 2);
      ctx.fillStyle = isActive ? 'rgba(59,130,246,0.2)' : 'rgba(34,197,94,0.2)';
      ctx.strokeStyle = isActive ? 'rgba(59,130,246,0.9)' : 'rgba(34,197,94,0.9)';
      ctx.lineWidth = isActive ? 2 : 1.5;
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px System';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(idx + 1), cx, cy);
    });
  }, [activeSpotIndex, layout.height, layout.width, spotRadii, spots]);

  useEffect(() => {
    void drawOverlay();
  }, [drawOverlay]);

  const onImageLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setLayout({ width: Math.max(width, 1), height: Math.max(height, 1) });
  }, []);

  const addSpotAt = useCallback((x: number, y: number) => {
    const next = mapPointToCanonical(x, y, layout.width, layout.height);
    setSpots(prev => {
      const n = [...prev, next];
      setActiveSpotIndex(n.length - 1);
      return n;
    });
    setSpotLabels(prev => [...prev, null]);
    setSpotRadii(prev => [...prev, DEFAULT_RADIUS]);
    setIsNone(false);
  }, [layout.height, layout.width]);

  const hitResizeHandle = useCallback((x: number, y: number): { index: number; centerX: number; centerY: number } | null => {
    for (let i = 0; i < spots.length; i += 1) {
      const spot = spots[i];
      const cx = spot.xPct * layout.width;
      const cy = spot.yPct * layout.height;
      const radiusPx = ((spotRadii[i] ?? DEFAULT_RADIUS) / 1024) * layout.width;
      const d = distance(x, y, cx, cy);
      if (Math.abs(d - radiusPx) <= 18) {
        return { index: i, centerX: cx, centerY: cy };
      }
    }
    return null;
  }, [layout.width, spotRadii, spots]);

  const panResponder: PanResponderInstance = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: event => {
      const { locationX, locationY } = event.nativeEvent;
      panStartRef.current = { x: locationX, y: locationY };
      movedRef.current = false;
      resizeRef.current = hitResizeHandle(locationX, locationY);
      if (resizeRef.current) setActiveSpotIndex(resizeRef.current.index);
    },
    onPanResponderMove: (event, gesture: PanResponderGestureState) => {
      if (Math.abs(gesture.dx) > 2 || Math.abs(gesture.dy) > 2) movedRef.current = true;
      const resizing = resizeRef.current;
      if (!resizing) return;
      const { locationX, locationY } = event.nativeEvent;
      const d = distance(locationX, locationY, resizing.centerX, resizing.centerY);
      const nextRadius = Math.max(DEFAULT_RADIUS, Math.min(MAX_RADIUS, Math.round((d / layout.width) * 1024)));
      setSpotRadii(prev => prev.map((r, i) => (i === resizing.index ? nextRadius : r)));
    },
    onPanResponderRelease: event => {
      if (isNone) return;
      const start = panStartRef.current;
      const resizing = resizeRef.current;
      resizeRef.current = null;

      if (resizing) return;
      if (!start || movedRef.current) return;

      const { locationX, locationY } = event.nativeEvent;
      addSpotAt(locationX, locationY);
    },
  }), [addSpotAt, hitResizeHandle, isNone, layout.width]);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const payload: SubmitPayload = {
        task_type: taskType,
        user_label: isNone ? 'none' : ((spotLabels.find(Boolean) as UserLabel | undefined) ?? 'none'),
        confidence,
        comments: comments.trim(),
        pixel_coords: isNone ? [] : spots.map(({ x, y }) => ({ x, y })),
        pixel_labels: isNone ? [] : spotLabels,
        pixel_radii: isNone ? [] : spotRadii,
      };
      await onSubmit(payload);
      setSpots([]);
      setSpotLabels([]);
      setSpotRadii([]);
      setActiveSpotIndex(null);
      setComments('');
      setConfidence(75);
      setIsNone(false);
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, comments, confidence, isNone, onSubmit, spotLabels, spotRadii, spots, taskType]);

  return (
    <View style={styles.container}>
      <View style={styles.imageWrap} onLayout={onImageLayout} {...panResponder.panHandlers}>
        <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="contain" />
        <Canvas ref={canvas => { canvasRef.current = canvas; }} style={StyleSheet.absoluteFillObject} />
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>No feature visible</Text>
        <Switch
          value={isNone}
          onValueChange={value => {
            setIsNone(value);
            if (value) {
              setSpots([]);
              setSpotLabels([]);
              setSpotRadii([]);
              setActiveSpotIndex(null);
            }
          }}
        />
      </View>

      {activeSpotIndex !== null && !isNone && (
        <View style={styles.editor}>
          <Text style={styles.editorTitle}>Region {activeSpotIndex + 1}</Text>
          <Picker
            selectedValue={spotLabels[activeSpotIndex] ?? ''}
            onValueChange={value => setSpotLabels(prev => prev.map((l, i) => (i === activeSpotIndex ? (value as UserLabel) : l)))}
          >
            <Picker.Item label="Select label..." value="" />
            {labelsForTask.map(label => <Picker.Item key={label} label={label} value={label} />)}
          </Picker>
          <Text style={styles.helper}>Drag a circle edge to resize.</Text>
        </View>
      )}

      <Text style={styles.label}>Confidence: {confidence}%</Text>
      <TextInput
        value={String(confidence)}
        onChangeText={text => {
          const n = Number(text);
          if (!Number.isNaN(n)) setConfidence(Math.max(0, Math.min(100, n)));
        }}
        keyboardType="number-pad"
        style={styles.input}
      />

      <TextInput
        value={comments}
        onChangeText={setComments}
        style={[styles.input, styles.notes]}
        placeholder="Notes (optional)"
        multiline
      />

      <TouchableOpacity style={[styles.submit, !canSubmit && styles.submitDisabled]} onPress={handleSubmit} disabled={!canSubmit}>
        <Text style={styles.submitText}>{submitting ? 'Submitting...' : 'Submit Observation'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  imageWrap: { width: '100%', aspectRatio: 1, borderRadius: 16, overflow: 'hidden', backgroundColor: '#060b17' },
  image: { width: '100%', height: '100%' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { color: '#cbd5e1', fontSize: 14 },
  editor: { backgroundColor: '#0f172a', borderRadius: 12, padding: 12 },
  editorTitle: { color: '#f8fafc', fontWeight: '700', marginBottom: 6 },
  helper: { color: '#94a3b8', fontSize: 12, marginTop: 6 },
  input: { borderWidth: 1, borderColor: '#334155', borderRadius: 10, color: '#f8fafc', paddingHorizontal: 10, paddingVertical: 8 },
  notes: { minHeight: 72, textAlignVertical: 'top' },
  submit: { backgroundColor: '#f59e0b', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  submitDisabled: { opacity: 0.5 },
  submitText: { color: '#0f172a', fontWeight: '700' },
});
