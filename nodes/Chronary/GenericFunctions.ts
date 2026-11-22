import type { IDataObject, IExecuteSingleFunctions, IHttpRequestOptions, PreSendAction } from 'n8n-workflow';

/** Default the UI shows for Calendar → Create → Timezone. The API requires a timezone. */
export const DEFAULT_CALENDAR_TIMEZONE = 'UTC';

/** Default the UI shows for Agent → Create → Type. The API requires a type. */
export const DEFAULT_AGENT_TYPE = 'ai';

/**
 * Encode one ID as a single URL path segment (#2519). `encodeURIComponent`
 * keeps `/`, `?`, `#` and `%` inside the segment, so an ID like
 * `../agents/agt_1` can't turn Event → Cancel into a call on another
 * resource. Encoding leaves dots alone and a `.` / `..` segment would be
 * resolved before the request reaches the API, so those and an empty ID are
 * refused before anything is sent.
 */
export function encodePathSegment(value: unknown): string {
  const segment = value === undefined || value === null ? '' : String(value).trim();
  if (segment === '' || segment === '.' || segment === '..') {
    throw new Error(
      `Invalid ID ${JSON.stringify(segment)}: an ID must not be empty, "." or "..". No request was sent.`,
    );
  }
  return encodeURIComponent(segment);
}

/**
 * preSend that sets the request URL from a template such as
 * `/v1/calendars/{calendarId}/events`, filling each `{param}` with that node
 * parameter, encoded by `encodePathSegment`. Used instead of
 * `={{$parameter.x}}` URL expressions, which interpolate the ID raw.
 */
export function idPath(template: string): PreSendAction {
  return async function (
    this: IExecuteSingleFunctions,
    requestOptions: IHttpRequestOptions,
  ): Promise<IHttpRequestOptions> {
    requestOptions.url = template.replace(/\{(\w+)\}/g, (_m, name: string) =>
      encodePathSegment(this.getNodeParameter(name, '')),
    );
    return requestOptions;
  };
}

function bodyOf(requestOptions: IHttpRequestOptions): IDataObject {
  const body = requestOptions.body;
  if (body && typeof body === 'object' && !Array.isArray(body)) {
    return body as IDataObject;
  }
  const fresh: IDataObject = {};
  requestOptions.body = fresh;
  return fresh;
}

/**
 * Calendar → Create.
 *
 * `POST /v1/calendars` has no `agent_id` body field (the API strips unknown
 * keys), so an Agent ID sent in the body was silently dropped and the calendar
 * was created without an owner. An agent-owned calendar is created at
 * `POST /v1/agents/{agent_id}/calendars` instead, so route there when an Agent
 * ID is set and never send it in the body. Both routes require `timezone`;
 * fill in the default the UI shows when the field wasn't added.
 */
export async function calendarCreatePreSend(
  this: IExecuteSingleFunctions,
  requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
  const fields = (this.getNodeParameter('calendarCreateFields', {}) ?? {}) as IDataObject;
  const rawAgentId = fields.agent_id;
  const agentId = rawAgentId === undefined || rawAgentId === null ? '' : String(rawAgentId).trim();

  requestOptions.url = agentId
    ? `/v1/agents/${encodePathSegment(agentId)}/calendars`
    : '/v1/calendars';

  const body = bodyOf(requestOptions);
  delete body.agent_id;
  if (typeof body.timezone !== 'string' || body.timezone.trim() === '') {
    body.timezone = DEFAULT_CALENDAR_TIMEZONE;
  }
  return requestOptions;
}

/**
 * Agent → Create. The API requires `type`, but the node offers it under
 * Additional Fields; send the default the UI shows when it wasn't added.
 */
export async function agentCreatePreSend(
  this: IExecuteSingleFunctions,
  requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
  const body = bodyOf(requestOptions);
  if (typeof body.type !== 'string' || body.type === '') {
    body.type = DEFAULT_AGENT_TYPE;
  }
  return requestOptions;
}
