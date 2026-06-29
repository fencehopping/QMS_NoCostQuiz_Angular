import { environment } from '../environments/environment';

const APP_ID_KEY = 'qms_application_id';
const ATTR_KEY = 'qms_attribution';
const UTM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'gclid',
  'fbclid',
  'msclkid',
] as const;
const SENSITIVE_KEY_PARTS = [
  'address',
  'dateofbirth',
  'dob',
  'doctor',
  'email',
  'insurance',
  'medicare',
  'memberid',
  'npi',
  'patientname',
  'phone',
  'physician',
  'policy',
  'subscriber',
] as const;
const SENSITIVE_KEYS = new Set([
  'city',
  'firstname',
  'lastname',
  'name',
  'state',
  'zip',
  'zipcode',
]);

type DataLayerEvent = Record<string, unknown>;

declare global {
  interface Window {
    dataLayer?: DataLayerEvent[];
    qmsDashboardBeaconInitialized?: boolean;
  }
}

export function initializeQmsDashboardBeacon(): void {
  if (typeof window === 'undefined' || window.qmsDashboardBeaconInitialized) {
    return;
  }

  window.qmsDashboardBeaconInitialized = true;
  window.dataLayer = window.dataLayer || [];
  const dataLayer = window.dataLayer;
  getQmsApplicationId();
  captureQmsAttribution();

  const originalPush = dataLayer.push.bind(dataLayer);
  dataLayer.push = (...items: DataLayerEvent[]): number => {
    const enrichedItems = items.map((item) => enrichQmsApplicationEvent(item));
    const result = originalPush(...enrichedItems);
    enrichedItems.forEach((item) => {
      if (item['event'] === 'qms_application_event') {
        sendQmsApplicationEvent(item);
      }
    });
    return result;
  };
}

export function getQmsApplicationId(): string {
  let id = '';
  try {
    id = window.localStorage.getItem(APP_ID_KEY) || '';
  } catch {
    id = '';
  }

  if (!id) {
    id =
      window.crypto && typeof window.crypto.randomUUID === 'function'
        ? window.crypto.randomUUID()
        : `qms_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    try {
      window.localStorage.setItem(APP_ID_KEY, id);
    } catch {
      // Storage can be unavailable in private browsing or blocked contexts.
    }
  }

  return id;
}

export function captureQmsAttribution(): Record<string, string> {
  let attribution: Record<string, string> = {};
  try {
    attribution = JSON.parse(window.localStorage.getItem(ATTR_KEY) || '{}') || {};
  } catch {
    attribution = {};
  }

  const params = getUrlParams();
  UTM_KEYS.forEach((key) => {
    const value = params.get(key);
    if (value) {
      attribution[key] = value;
    }
  });

  if (!attribution['landing_page']) {
    attribution['landing_page'] = window.location.pathname || '/';
  }
  if (!attribution['referrer'] && document.referrer) {
    attribution['referrer'] = document.referrer;
  }

  try {
    window.localStorage.setItem(ATTR_KEY, JSON.stringify(attribution));
  } catch {
    // Best effort only; events still receive in-memory attribution.
  }

  return attribution;
}

function getUrlParams(): URLSearchParams {
  const normalParams = new URLSearchParams(window.location.search);
  const hashQuery = window.location.hash.split('?')[1] || '';
  const hashParams = new URLSearchParams(hashQuery);

  hashParams.forEach((value, key) => {
    if (!normalParams.has(key)) {
      normalParams.set(key, value);
    }
  });

  return normalParams;
}

function enrichQmsApplicationEvent(item: DataLayerEvent): DataLayerEvent {
  if (!item || item['event'] !== 'qms_application_event') {
    return item;
  }

  return {
    ...item,
    application_id: item['application_id'] || getQmsApplicationId(),
    attribution: item['attribution'] || captureQmsAttribution(),
  };
}

function sendQmsApplicationEvent(item: DataLayerEvent): void {
  const outbound = stripSensitiveFields(item) as DataLayerEvent;
  const body = JSON.stringify({
    k: environment.qmsDashboardIngestKey,
    ...outbound,
  });

  if (navigator.sendBeacon && navigator.sendBeacon(environment.qmsDashboardIngestUrl, body)) {
    return;
  }

  fetch(environment.qmsDashboardIngestUrl, {
    method: 'POST',
    body,
    keepalive: true,
  }).catch(() => undefined);
}

function stripSensitiveFields(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => stripSensitiveFields(item));
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !isSensitiveKey(key))
      .map(([key, fieldValue]) => [key, stripSensitiveFields(fieldValue)]),
  );
}

function isSensitiveKey(key: string): boolean {
  const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, '');
  return SENSITIVE_KEYS.has(normalized) || SENSITIVE_KEY_PARTS.some((part) => normalized.includes(part));
}
