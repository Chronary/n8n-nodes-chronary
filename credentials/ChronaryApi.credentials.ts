import {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class ChronaryApi implements ICredentialType {
  name = 'chronaryApi';

  displayName = 'Chronary API';

  documentationUrl = 'https://docs.chronary.ai/getting-started/authentication';

  properties: INodeProperties[] = [
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      required: true,
      description:
        'Your Chronary API key — an org key (chr_sk_…) or an agent-scoped key (chr_ak_…). Create one at https://console.chronary.ai',
    },
  ];

  // Sent on every request as a Bearer token. Chronary is API-key auth — no OAuth.
  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        Authorization: '=Bearer {{$credentials.apiKey}}',
      },
    },
  };

  // Verifies the key on save by hitting a lightweight authenticated endpoint.
  test: ICredentialTestRequest = {
    request: {
      baseURL: 'https://api.chronary.ai',
      url: '/v1/usage',
    },
  };
}
