// Resolves the HTTP request each node operation sends, the way n8n's
// declarative routing does for the features this node uses:
//   - fields shown by `displayOptions.show`,
//   - the selected operation option's `routing.request` (`={{$parameter.x}}` URLs),
//   - `routing.send` body/query values on top-level fields and collection options,
//   - then every collected `routing.send.preSend`, run against the assembled request.
// No n8n runtime is needed: n8n-workflow only supplies types here.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type {
  IDataObject,
  IExecuteSingleFunctions,
  IHttpRequestOptions,
  INodeProperties,
  INodePropertyOptions,
  PreSendAction,
} from 'n8n-workflow';

import { Chronary } from '../nodes/Chronary/Chronary.node';

type Params = Record<string, unknown>;

interface ResolvedRequest {
  method: string;
  url: string;
  body: IDataObject;
  qs: IDataObject;
}

const properties = new Chronary().description.properties;

function isShown(prop: INodeProperties, params: Params): boolean {
  const show = prop.displayOptions?.show;
  if (!show) return true;
  return Object.entries(show).every(([key, values]) => (values as unknown[]).includes(params[key]));
}

function evalUrl(url: string, params: Params): string {
  if (!url.startsWith('=')) return url;
  const resolved = url.slice(1).replace(/\{\{\s*\$parameter\.(\w+)\s*\}\}/g, (_m, name: string) => {
    assert.ok(params[name] !== undefined, `URL needs parameter ${name}`);
    return String(params[name]);
  });
  assert.ok(!resolved.includes('{{'), `unsupported URL expression: ${url}`);
  return resolved;
}

async function resolveRequest(params: Params): Promise<ResolvedRequest> {
  let method = '';
  let url = '';
  const body: IDataObject = {};
  const qs: IDataObject = {};
  const preSend: PreSendAction[] = [];

  const applySend = (send: NonNullable<INodeProperties['routing']>['send'], value: unknown): void => {
    if (!send) return;
    if (send.property !== undefined && value !== undefined) {
      (send.type === 'query' ? qs : body)[send.property] = value as IDataObject[string];
    }
    if (send.preSend) preSend.push(...send.preSend);
  };

  for (const prop of properties) {
    if (!isShown(prop, params)) continue;
    const value = params[prop.name];

    if (prop.type === 'options' && prop.options) {
      const option = (prop.options as INodePropertyOptions[]).find((o) => o.value === value);
      const routing = option?.routing;
      if (routing?.request) {
        if (routing.request.method) method = routing.request.method;
        if (routing.request.url) url = evalUrl(routing.request.url, params);
      }
      if (routing?.send) applySend(routing.send, undefined);
    }

    if (prop.routing?.send && value !== undefined) applySend(prop.routing.send, value);

    if (prop.type === 'collection' && value && typeof value === 'object') {
      for (const option of prop.options as INodeProperties[]) {
        const optionValue = (value as Params)[option.name];
        if (optionValue !== undefined && option.routing?.send) applySend(option.routing.send, optionValue);
      }
    }
  }

  let options: IHttpRequestOptions = { method: method as IHttpRequestOptions['method'], url, body, qs };
  const context = {
    getNodeParameter: (name: string, fallback?: unknown) => (name in params ? params[name] : fallback),
  } as unknown as IExecuteSingleFunctions;
  for (const fn of preSend) options = await fn.call(context, options);

  return {
    method: String(options.method),
    url: options.url,
    body: (options.body ?? {}) as IDataObject,
    qs: (options.qs ?? {}) as IDataObject,
  };
}

// ─── Calendar → Create (#1990) ───────────────────────────────────────

test('calendar.create without Agent ID posts to /v1/calendars with the default timezone', async () => {
  const req = await resolveRequest({ resource: 'calendar', operation: 'create', name: 'Ops' });
  assert.equal(req.method, 'POST');
  assert.equal(req.url, '/v1/calendars');
  assert.deepEqual(req.body, { name: 'Ops', timezone: 'UTC' });
});

test('calendar.create with Agent ID posts to the agent-owned route and keeps agent_id out of the body', async () => {
  const req = await resolveRequest({
    resource: 'calendar',
    operation: 'create',
    name: 'Ops',
    calendarCreateFields: { agent_id: 'agt_123', timezone: 'America/New_York' },
  });
  assert.equal(req.method, 'POST');
  assert.equal(req.url, '/v1/agents/agt_123/calendars');
  assert.deepEqual(req.body, { name: 'Ops', timezone: 'America/New_York' });
  assert.ok(!('agent_id' in req.body));
});

test('calendar.create trims the Agent ID and treats a blank one as unset', async () => {
  const trimmed = await resolveRequest({
    resource: 'calendar',
    operation: 'create',
    name: 'Ops',
    calendarCreateFields: { agent_id: '  agt_123  ' },
  });
  assert.equal(trimmed.url, '/v1/agents/agt_123/calendars');

  const blank = await resolveRequest({
    resource: 'calendar',
    operation: 'create',
    name: 'Ops',
    calendarCreateFields: { agent_id: '   ', timezone: '' },
  });
  assert.equal(blank.url, '/v1/calendars');
  assert.deepEqual(blank.body, { name: 'Ops', timezone: 'UTC' });
});

test('calendar.create URL-encodes the Agent ID path segment', async () => {
  const req = await resolveRequest({
    resource: 'calendar',
    operation: 'create',
    name: 'Ops',
    calendarCreateFields: { agent_id: 'agt_1/../x?y' },
  });
  assert.equal(req.url, '/v1/agents/agt_1%2F..%2Fx%3Fy/calendars');
});

// ─── Agent → Create ──────────────────────────────────────────────────

test('agent.create defaults the required type to ai', async () => {
  const req = await resolveRequest({ resource: 'agent', operation: 'create', name: 'Bot' });
  assert.equal(req.url, '/v1/agents');
  assert.deepEqual(req.body, { name: 'Bot', type: 'ai' });
});

test('agent.create keeps an explicit type', async () => {
  const req = await resolveRequest({
    resource: 'agent',
    operation: 'create',
    name: 'Desk',
    agentAdditionalFields: { type: 'human', description: 'Front desk' },
  });
  assert.deepEqual(req.body, { name: 'Desk', type: 'human', description: 'Front desk' });
});

// ─── Every operation: method + URL ───────────────────────────────────

const ids = { agentId: 'agt_1', calendarId: 'cal_1', eventId: 'evt_1' };

const routes: Array<[string, string, string, string]> = [
  ['agent', 'create', 'POST', '/v1/agents'],
  ['agent', 'get', 'GET', '/v1/agents/agt_1'],
  ['agent', 'getAll', 'GET', '/v1/agents'],
  ['calendar', 'create', 'POST', '/v1/calendars'],
  ['calendar', 'delete', 'DELETE', '/v1/calendars/cal_1'],
  ['calendar', 'get', 'GET', '/v1/calendars/cal_1'],
  ['calendar', 'getAll', 'GET', '/v1/calendars'],
  ['calendar', 'update', 'PATCH', '/v1/calendars/cal_1'],
  ['event', 'cancel', 'DELETE', '/v1/events/evt_1'],
  ['event', 'create', 'POST', '/v1/calendars/cal_1/events'],
  ['event', 'get', 'GET', '/v1/events/evt_1'],
  ['event', 'getAll', 'GET', '/v1/calendars/cal_1/events'],
  ['event', 'update', 'PATCH', '/v1/events/evt_1'],
  ['availability', 'get', 'GET', '/v1/agents/agt_1/availability'],
];

test('every operation resolves to its API route', async () => {
  for (const [resource, operation, method, url] of routes) {
    const req = await resolveRequest({ resource, operation, ...ids });
    assert.equal(req.method, method, `${resource}.${operation} method`);
    assert.equal(req.url, url, `${resource}.${operation} url`);
  }
});

test('the route table covers every operation the node offers', () => {
  const offered: string[] = [];
  for (const prop of properties) {
    if (prop.name !== 'operation') continue;
    const resource = (prop.displayOptions?.show?.resource as string[])[0];
    for (const option of prop.options as INodePropertyOptions[]) offered.push(`${resource}.${option.value}`);
  }
  assert.deepEqual(offered.sort(), routes.map(([r, o]) => `${r}.${o}`).sort());
});

// ─── Body keys stay inside the API schema ────────────────────────────
// Mirrors the request schemas in packages/shared/src/schemas (Zod strips
// unknown keys, so a key outside these lists is silently dropped by the API).

const schemaKeys: Record<string, string[]> = {
  'agent.create': ['name', 'type', 'description', 'metadata'], // CreateAgentSchema
  'calendar.create': ['name', 'timezone', 'agent_status', 'default_reminders', 'metadata'], // CreateCalendarSchema
  'calendar.update': ['name', 'timezone', 'agent_status', 'default_reminders', 'metadata'], // UpdateCalendarSchema
  'event.create': [
    'title', 'start_time', 'end_time', 'description', 'all_day', 'status', 'metadata',
    'reminders', 'recurrence_rule', 'hold_expires_at', 'hold_priority',
  ], // CreateEventSchema
  'event.update': [
    'title', 'description', 'start_time', 'end_time', 'all_day', 'status', 'metadata',
    'reminders', 'recurrence_rule',
  ], // UpdateEventSchema
};

/** Every field shown for the operation, set to a sample value (collections fully populated). */
function allFieldsSet(resource: string, operation: string): Params {
  const params: Params = { resource, operation, ...ids };
  for (const prop of properties) {
    if (prop.name === 'resource' || prop.name === 'operation') continue;
    if (!isShown(prop, params)) continue;
    if (prop.type === 'collection') {
      const value: Params = {};
      for (const option of prop.options as INodeProperties[]) value[option.name] = sample(option);
      params[prop.name] = value;
    } else if (params[prop.name] === undefined) {
      params[prop.name] = sample(prop);
    }
  }
  return params;
}

function sample(prop: INodeProperties): unknown {
  if (prop.type === 'boolean') return true;
  if (prop.type === 'dateTime') return '2026-11-12T10:00:00Z';
  if (prop.type === 'options') return (prop.options as INodePropertyOptions[])[0].value;
  return `sample_${prop.name}`;
}

test('no operation sends a body key its API schema would strip', async () => {
  for (const [key, allowed] of Object.entries(schemaKeys)) {
    const [resource, operation] = key.split('.');
    const req = await resolveRequest(allFieldsSet(resource, operation));
    for (const bodyKey of Object.keys(req.body)) {
      assert.ok(allowed.includes(bodyKey), `${key} sends "${bodyKey}", which the API schema does not accept`);
    }
  }
});

test('operations without a body schema send no body fields', async () => {
  for (const [resource, operation] of routes) {
    if (schemaKeys[`${resource}.${operation}`]) continue;
    const req = await resolveRequest(allFieldsSet(resource, operation));
    assert.deepEqual(req.body, {}, `${resource}.${operation} body`);
  }
});

test('availability.get sends its window as query parameters', async () => {
  const req = await resolveRequest({
    resource: 'availability',
    operation: 'get',
    agentId: 'agt_1',
    start: '2026-11-12T00:00:00Z',
    end: '2026-11-13T00:00:00Z',
    availabilityOptions: { duration: '1h' },
  });
  assert.deepEqual(req.qs, { start: '2026-11-12T00:00:00Z', end: '2026-11-13T00:00:00Z', duration: '1h' });
});
