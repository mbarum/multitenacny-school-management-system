import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../../services/api';
import { SsoConfiguration, SsoProvider } from '../../types';

const SsoSettings: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: ssoConfigs = [] } = useQuery<SsoConfiguration[]>({ queryKey: ['sso-configs'], queryFn: api.getSsoConfigs });

  const mutation = useMutation({
    mutationFn: (config: Partial<SsoConfiguration>) => config.id ? api.updateSsoConfig(config.id, config) : api.createSsoConfig(config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sso-configs'] });
    },
  });

  const [newConfig, setNewConfig] = useState<Partial<SsoConfiguration>>({});

  const handleSave = () => {
    mutation.mutate(newConfig);
    setNewConfig({});
  };

  return (
    <div className="space-y-8">
      <h3 className="text-2xl font-bold">Single Sign-On (SSO)</h3>
      <div className="space-y-4">
        {ssoConfigs.map(config => (
          <div key={config.id} className="p-4 border rounded-md">
            <p className="font-bold">{config.provider}</p>
            <p>Client ID: {config.clientId}</p>
            <p>Issuer URL: {config.issuerUrl}</p>
          </div>
        ))}
      </div>
      <div className="space-y-4 p-4 border rounded-md">
        <h4 className="font-bold">Add New SSO Provider</h4>
        <select value={newConfig.provider} onChange={e => setNewConfig({ ...newConfig, provider: e.target.value as SsoProvider })} className="w-full p-2 border rounded">
          <option>Select Provider</option>
          {Object.values(SsoProvider).map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <input type="text" placeholder="Client ID" value={newConfig.clientId || ''} onChange={e => setNewConfig({ ...newConfig, clientId: e.target.value })} className="w-full p-2 border rounded" />
        <input type="text" placeholder="Client Secret" value={newConfig.clientSecret || ''} onChange={e => setNewConfig({ ...newConfig, clientSecret: e.target.value })} className="w-full p-2 border rounded" />
        <input type="text" placeholder="Issuer URL" value={newConfig.issuerUrl || ''} onChange={e => setNewConfig({ ...newConfig, issuerUrl: e.target.value })} className="w-full p-2 border rounded" />
        <button onClick={handleSave} className="px-4 py-2 bg-blue-500 text-white rounded">Save</button>
      </div>
    </div>
  );
};

export default SsoSettings;
