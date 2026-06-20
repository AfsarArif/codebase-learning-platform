import Redis from 'ioredis';

const CELERY_QUEUE = 'celery';

interface CeleryTaskMessage {
  task: string;
  args: unknown[];
  kwargs?: Record<string, unknown>;
}

export async function dispatchCeleryTask(
  message: CeleryTaskMessage,
  redisUrl?: string,
): Promise<string> {
  // Use CELERY_BROKER_URL first (Celery queue), fall back to REDIS_URL (cache)
  const url = redisUrl ?? process.env.CELERY_BROKER_URL ?? process.env.REDIS_URL ?? 'redis://localhost:6379/0';
  console.log('[dispatchCeleryTask] connecting to', url);
  const redis = new Redis(url);

  const taskId = crypto.randomUUID();
  const body = JSON.stringify(message.args);

  const payload = {
    body: Buffer.from(body).toString('base64'),
    'content-encoding': 'utf-8',
    'content-type': 'application/json',
    headers: {
      task: message.task,
      id: taskId,
      root_id: taskId,
      parent_id: null,
      group: null,
      retries: 0,
      eta: null,
      expires: null,
      argsrepr: JSON.stringify(message.args),
      kwargsrepr: JSON.stringify(message.kwargs ?? {}),
      origin: 'web@codebase-learning',
      ignore_result: false,
    },
    properties: {
      correlation_id: taskId,
      reply_to: '',
      delivery_mode: 2,
      delivery_info: {
        priority: 0,
        routing_key: CELERY_QUEUE,
        exchange: CELERY_QUEUE,
      },
      body_encoding: 'base64',
      delivery_tag: crypto.randomUUID(),
    },
  };

  await redis.lpush(CELERY_QUEUE, JSON.stringify(payload));
  await redis.quit();
  return taskId;
}
