import { INodeType, INodeTypeDescription } from 'n8n-workflow';

export class Chronary implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Chronary',
    name: 'chronary',
    icon: 'file:chronary.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description:
      'Give an AI agent its own calendar: manage calendars, events, availability, and agents via the Chronary API.',
    defaults: { name: 'Chronary' },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [{ name: 'chronaryApi', required: true }],
    requestDefaults: {
      baseURL: 'https://api.chronary.ai',
      headers: { 'Content-Type': 'application/json' },
    },
    properties: [
      // ─── Resource ───────────────────────────────────────────────
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        options: [
          { name: 'Agent', value: 'agent' },
          { name: 'Calendar', value: 'calendar' },
          { name: 'Event', value: 'event' },
          { name: 'Availability', value: 'availability' },
        ],
        default: 'event',
      },

      // ─── Agent operations ───────────────────────────────────────
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['agent'] } },
        options: [
          {
            name: 'Create',
            value: 'create',
            action: 'Create an agent',
            routing: { request: { method: 'POST', url: '/v1/agents' } },
          },
          {
            name: 'Get',
            value: 'get',
            action: 'Get an agent',
            routing: { request: { method: 'GET', url: '=/v1/agents/{{$parameter.agentId}}' } },
          },
          {
            name: 'Get Many',
            value: 'getAll',
            action: 'Get many agents',
            routing: { request: { method: 'GET', url: '/v1/agents' } },
          },
        ],
        default: 'getAll',
      },

      // ─── Calendar operations ────────────────────────────────────
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['calendar'] } },
        options: [
          {
            name: 'Create',
            value: 'create',
            action: 'Create a calendar',
            routing: { request: { method: 'POST', url: '/v1/calendars' } },
          },
          {
            name: 'Delete',
            value: 'delete',
            action: 'Delete a calendar',
            routing: { request: { method: 'DELETE', url: '=/v1/calendars/{{$parameter.calendarId}}' } },
          },
          {
            name: 'Get',
            value: 'get',
            action: 'Get a calendar',
            routing: { request: { method: 'GET', url: '=/v1/calendars/{{$parameter.calendarId}}' } },
          },
          {
            name: 'Get Many',
            value: 'getAll',
            action: 'Get many calendars',
            routing: { request: { method: 'GET', url: '/v1/calendars' } },
          },
          {
            name: 'Update',
            value: 'update',
            action: 'Update a calendar',
            routing: { request: { method: 'PATCH', url: '=/v1/calendars/{{$parameter.calendarId}}' } },
          },
        ],
        default: 'getAll',
      },

      // ─── Event operations ───────────────────────────────────────
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['event'] } },
        options: [
          {
            name: 'Create',
            value: 'create',
            action: 'Create an event',
            routing: {
              request: { method: 'POST', url: '=/v1/calendars/{{$parameter.calendarId}}/events' },
            },
          },
          {
            name: 'Cancel',
            value: 'cancel',
            action: 'Cancel an event',
            routing: { request: { method: 'DELETE', url: '=/v1/events/{{$parameter.eventId}}' } },
          },
          {
            name: 'Get',
            value: 'get',
            action: 'Get an event',
            routing: { request: { method: 'GET', url: '=/v1/events/{{$parameter.eventId}}' } },
          },
          {
            name: 'Get Many',
            value: 'getAll',
            action: 'Get many events',
            routing: {
              request: { method: 'GET', url: '=/v1/calendars/{{$parameter.calendarId}}/events' },
            },
          },
          {
            name: 'Update',
            value: 'update',
            action: 'Update an event',
            routing: { request: { method: 'PATCH', url: '=/v1/events/{{$parameter.eventId}}' } },
          },
        ],
        default: 'getAll',
      },

      // ─── Availability operations ────────────────────────────────
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['availability'] } },
        options: [
          {
            name: 'Get',
            value: 'get',
            action: 'Get agent availability',
            routing: {
              request: { method: 'GET', url: '=/v1/agents/{{$parameter.agentId}}/availability' },
            },
          },
        ],
        default: 'get',
      },

      // ─── ID fields ──────────────────────────────────────────────
      {
        displayName: 'Agent ID',
        name: 'agentId',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['agent', 'availability'],
            operation: ['get'],
          },
        },
        description: 'The agent ID (agt_…)',
      },
      {
        displayName: 'Calendar ID',
        name: 'calendarId',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['calendar'],
            operation: ['get', 'update', 'delete'],
          },
        },
        description: 'The calendar ID (cal_…)',
      },
      {
        displayName: 'Calendar ID',
        name: 'calendarId',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['event'],
            operation: ['create', 'getAll'],
          },
        },
        description: 'The calendar ID (cal_…) the event belongs to',
      },
      {
        displayName: 'Event ID',
        name: 'eventId',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['event'],
            operation: ['get', 'update', 'cancel'],
          },
        },
        description: 'The event ID (evt_…)',
      },

      // ─── Agent: create ──────────────────────────────────────────
      {
        displayName: 'Name',
        name: 'name',
        type: 'string',
        default: '',
        required: true,
        displayOptions: { show: { resource: ['agent'], operation: ['create'] } },
        routing: { send: { type: 'body', property: 'name' } },
        description: 'Display name for the agent',
      },
      {
        displayName: 'Additional Fields',
        name: 'agentAdditionalFields',
        type: 'collection',
        placeholder: 'Add Field',
        default: {},
        displayOptions: { show: { resource: ['agent'], operation: ['create'] } },
        options: [
          {
            displayName: 'Type',
            name: 'type',
            type: 'options',
            options: [
              { name: 'AI', value: 'ai' },
              { name: 'Human', value: 'human' },
              { name: 'Resource', value: 'resource' },
            ],
            default: 'ai',
            routing: { send: { type: 'body', property: 'type' } },
          },
          {
            displayName: 'Description',
            name: 'description',
            type: 'string',
            default: '',
            routing: { send: { type: 'body', property: 'description' } },
          },
        ],
      },

      // ─── Calendar: create ───────────────────────────────────────
      {
        displayName: 'Name',
        name: 'name',
        type: 'string',
        default: '',
        required: true,
        displayOptions: { show: { resource: ['calendar'], operation: ['create'] } },
        routing: { send: { type: 'body', property: 'name' } },
        description: 'Display name for the calendar',
      },
      {
        displayName: 'Additional Fields',
        name: 'calendarCreateFields',
        type: 'collection',
        placeholder: 'Add Field',
        default: {},
        displayOptions: { show: { resource: ['calendar'], operation: ['create'] } },
        options: [
          {
            displayName: 'Timezone',
            name: 'timezone',
            type: 'string',
            default: 'UTC',
            description: 'IANA timezone, e.g. America/New_York',
            routing: { send: { type: 'body', property: 'timezone' } },
          },
          {
            displayName: 'Agent ID',
            name: 'agent_id',
            type: 'string',
            default: '',
            description: 'Owning agent (agt_…). Optional for org keys.',
            routing: { send: { type: 'body', property: 'agent_id' } },
          },
        ],
      },

      // ─── Calendar: update ───────────────────────────────────────
      {
        displayName: 'Update Fields',
        name: 'calendarUpdateFields',
        type: 'collection',
        placeholder: 'Add Field',
        default: {},
        displayOptions: { show: { resource: ['calendar'], operation: ['update'] } },
        options: [
          {
            displayName: 'Name',
            name: 'name',
            type: 'string',
            default: '',
            routing: { send: { type: 'body', property: 'name' } },
          },
          {
            displayName: 'Timezone',
            name: 'timezone',
            type: 'string',
            default: '',
            routing: { send: { type: 'body', property: 'timezone' } },
          },
        ],
      },

      // ─── Event: create ──────────────────────────────────────────
      {
        displayName: 'Title',
        name: 'title',
        type: 'string',
        default: '',
        required: true,
        displayOptions: { show: { resource: ['event'], operation: ['create'] } },
        routing: { send: { type: 'body', property: 'title' } },
      },
      {
        displayName: 'Start Time',
        name: 'start_time',
        type: 'dateTime',
        default: '',
        required: true,
        displayOptions: { show: { resource: ['event'], operation: ['create'] } },
        routing: { send: { type: 'body', property: 'start_time' } },
        description: 'ISO 8601 start time',
      },
      {
        displayName: 'End Time',
        name: 'end_time',
        type: 'dateTime',
        default: '',
        required: true,
        displayOptions: { show: { resource: ['event'], operation: ['create'] } },
        routing: { send: { type: 'body', property: 'end_time' } },
        description: 'ISO 8601 end time',
      },
      {
        displayName: 'Additional Fields',
        name: 'eventCreateFields',
        type: 'collection',
        placeholder: 'Add Field',
        default: {},
        displayOptions: { show: { resource: ['event'], operation: ['create'] } },
        options: [
          {
            displayName: 'Description',
            name: 'description',
            type: 'string',
            default: '',
            routing: { send: { type: 'body', property: 'description' } },
          },
          {
            displayName: 'All Day',
            name: 'all_day',
            type: 'boolean',
            default: false,
            routing: { send: { type: 'body', property: 'all_day' } },
          },
        ],
      },

      // ─── Event: update ──────────────────────────────────────────
      {
        displayName: 'Update Fields',
        name: 'eventUpdateFields',
        type: 'collection',
        placeholder: 'Add Field',
        default: {},
        displayOptions: { show: { resource: ['event'], operation: ['update'] } },
        options: [
          {
            displayName: 'Title',
            name: 'title',
            type: 'string',
            default: '',
            routing: { send: { type: 'body', property: 'title' } },
          },
          {
            displayName: 'Start Time',
            name: 'start_time',
            type: 'dateTime',
            default: '',
            routing: { send: { type: 'body', property: 'start_time' } },
          },
          {
            displayName: 'End Time',
            name: 'end_time',
            type: 'dateTime',
            default: '',
            routing: { send: { type: 'body', property: 'end_time' } },
          },
          {
            displayName: 'Description',
            name: 'description',
            type: 'string',
            default: '',
            routing: { send: { type: 'body', property: 'description' } },
          },
        ],
      },

      // ─── Availability: get ──────────────────────────────────────
      {
        displayName: 'Start',
        name: 'start',
        type: 'dateTime',
        default: '',
        required: true,
        displayOptions: { show: { resource: ['availability'], operation: ['get'] } },
        routing: { send: { type: 'query', property: 'start' } },
        description: 'ISO 8601 window start',
      },
      {
        displayName: 'End',
        name: 'end',
        type: 'dateTime',
        default: '',
        required: true,
        displayOptions: { show: { resource: ['availability'], operation: ['get'] } },
        routing: { send: { type: 'query', property: 'end' } },
        description: 'ISO 8601 window end',
      },
      {
        displayName: 'Options',
        name: 'availabilityOptions',
        type: 'collection',
        placeholder: 'Add Option',
        default: {},
        displayOptions: { show: { resource: ['availability'], operation: ['get'] } },
        options: [
          {
            displayName: 'Duration',
            name: 'duration',
            type: 'string',
            default: '30m',
            description: 'Slot duration, e.g. 30m or 1h',
            routing: { send: { type: 'query', property: 'duration' } },
          },
        ],
      },
    ],
  };
}
