import useSWR from "swr";

async function fetchApi(key) {
  const response = await fetch(key);
  const responsyBody = await response.json();
  return responsyBody;
}

export default function StatusPage() {
  return (
    <div className="w-full h-screen flex flex-col items-center justify-center gap-4 p-4 flex-wrap">
      <div className="w-full max-w-2xl">
        <div className="flex justify-between flex-wrap items-center">
          <h1 className="font-bold text-xl my-2">Status</h1>
          <UpdateAt />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
          <DataBaseStatus />
          <DataBaseVersion />
          <OpenConnections />
          <MaxConnections />
        </div>
      </div>
    </div>
  );
}

function UpdateAt() {
  const { isLoading, data } = useSWR("/api/v1/status", fetchApi, {
    refreshInterval: 2000,
  });

  let updatedAtText = "Carregando...";
  if (!isLoading && data) {
    updatedAtText = new Date(data.updated_at).toLocaleString();
  }

  return (
    <div className="text-sm text-gray-500">
      Última atualização: {updatedAtText}
    </div>
  );
}

function DataBaseStatus() {
  const { isLoading, data } = useSWR("/api/v1/status", fetchApi, {
    refreshInterval: 2000,
  });

  let statusText = "Carregando...";
  let colorStatus = "text-gray-500";
  if (!isLoading && data) {
    statusText = data?.dependencies?.database?.version ? "Online" : "Offline";
    colorStatus = data?.dependencies?.database?.version
      ? "text-green-500"
      : "text-red-500";
  }

  if (!data?.dependencies?.database?.version) return;

  return (
    <div className="border border-neutral-300 p-4 rounded-lg shadow-md flex items-start justify-center flex-col gap-2">
      <spam>Status do banco de dados:</spam>
      <span className={`${colorStatus} font-bold`}>{statusText}</span>
    </div>
  );
}

function DataBaseVersion() {
  const { isLoading, data } = useSWR("/api/v1/status", fetchApi, {
    refreshInterval: 2000,
  });

  let versionText = "Carregando...";
  if (!isLoading && data) {
    versionText = data?.dependencies?.database?.version;
  }

  if (!data?.dependencies?.database?.version) return;

  return (
    <div className="border border-neutral-300 p-4 rounded-lg shadow-md flex items-start justify-center flex-col gap-2">
      <spam>Versão do banco de dados:</spam>
      <span className="font-bold">{versionText}</span>
    </div>
  );
}

function OpenConnections() {
  const { isLoading, data } = useSWR("/api/v1/status", fetchApi, {
    refreshInterval: 2000,
  });

  let openedConnectionsText = "Carregando...";
  if (!isLoading && data) {
    openedConnectionsText = data?.dependencies?.database?.opened_conections;
  }

  return (
    <div className="border border-neutral-300 p-4 rounded-lg shadow-md flex items-start justify-center flex-col gap-2">
      <spam>Conexões abertas:</spam>
      <span className="font-bold">{openedConnectionsText}</span>
    </div>
  );
}

function MaxConnections() {
  const { isLoading, data } = useSWR("/api/v1/status", fetchApi, {
    refreshInterval: 2000,
  });

  let maxConnectionsText = "Carregando...";
  if (!isLoading && data) {
    maxConnectionsText = data?.dependencies?.database?.max_connections;
  }

  return (
    <div className="border border-neutral-300 p-4 rounded-lg shadow-md flex items-start justify-center flex-col gap-2">
      <spam>Conexões máximas:</spam>
      <span className="font-bold">{maxConnectionsText}</span>
    </div>
  );
}
