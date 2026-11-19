import { API_BASE_URL } from '../../../shared/constants/apiConfig';

export interface RecognizedLandmark {
  id: number;
  name: string;
  description: string;
  fullDescription?: string | null;
  architectureStyle?: string | null;
  buildYear?: number | null;
  photoUrl?: string | null;
  category?: string | null;
  latitude: number;
  longitude: number;
}

export interface RecognitionCandidate {
  landmarkId: number;
  visualScore: number;
  geoScore: number;
  headingScore: number;
  finalScore: number;
  distanceMeters: number;
}

export interface RecognitionMatchResponse {
  status: 'MATCHED' | 'UNCERTAIN' | 'NOT_FOUND';
  confidence: number;
  landmark: RecognizedLandmark | null;
  candidates: RecognitionCandidate[];
  modelVersion: string;
  processingMs: number;
}

export interface MatchLandmarkParams {
  photoUri: string;
  latitude: number;
  longitude: number;
  gpsAccuracyMeters?: number;
  headingDegrees?: number;
}

export async function matchLandmarkByPhoto({
  photoUri,
  latitude,
  longitude,
  gpsAccuracyMeters = 25,
  headingDegrees,
}: MatchLandmarkParams): Promise<RecognitionMatchResponse> {
  const normalizedUri = photoUri.startsWith('file://') ? photoUri : `file://${photoUri}`;

  const formData = new FormData();
  formData.append('image', {
    uri: normalizedUri,
    type: 'image/jpeg',
    name: 'capture.jpg',
  } as any);

  formData.append('latitude', String(latitude));
  formData.append('longitude', String(longitude));
  formData.append('gpsAccuracyMeters', String(gpsAccuracyMeters));

  if (typeof headingDegrees === 'number' && !Number.isNaN(headingDegrees)) {
    formData.append('headingDegrees', String(headingDegrees));
  }

  const response = await fetch(`${API_BASE_URL}/api/recognition/match`, {
    method: 'POST',
    body: formData,
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Recognition failed (${response.status}): ${errorText}`);
  }

  return response.json();
}