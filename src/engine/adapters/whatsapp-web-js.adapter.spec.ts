import { WhatsAppWebJsAdapter, WhatsAppSendUnconfirmedError, serializeWaId } from './whatsapp-web-js.adapter';
import { EngineStatus } from '../interfaces/whatsapp-engine.interface';

describe('WhatsAppWebJsAdapter send results', () => {
  const chatId = '34600000000@c.us';
  let adapter: WhatsAppWebJsAdapter;
  let sendMessage: jest.Mock;

  beforeEach(() => {
    adapter = new WhatsAppWebJsAdapter({ sessionId: 'test', sessionDataPath: '/tmp/openwa-test' });
    sendMessage = jest.fn();
    // Inject a fake ready client: we only exercise the result handling.
    const internals = adapter as unknown as { client: unknown; status: EngineStatus };
    internals.client = { sendMessage };
    internals.status = EngineStatus.READY;
  });

  it('returns the serialized id and timestamp of the sent message', async () => {
    sendMessage.mockResolvedValue({ id: { _serialized: 'true_34600000000@c.us_ABC' }, timestamp: 1730800000 });

    await expect(adapter.sendTextMessage(chatId, 'hola')).resolves.toEqual({
      id: 'true_34600000000@c.us_ABC',
      timestamp: 1730800000,
    });
    expect(sendMessage).toHaveBeenCalledWith(chatId, 'hola');
  });

  it('accepts the `$1` id that WhatsApp Web uses since July 2026', async () => {
    sendMessage.mockResolvedValue({ id: { $1: 'true_34600000000@c.us_DEF' }, timestamp: 1730800001 });

    await expect(adapter.sendTextMessage(chatId, 'hola')).resolves.toEqual({
      id: 'true_34600000000@c.us_DEF',
      timestamp: 1730800001,
    });
  });

  it('throws a clear error (not a TypeError) when sendMessage resolves undefined', async () => {
    sendMessage.mockResolvedValue(undefined);

    const promise = adapter.sendTextMessage(chatId, 'hola');
    await expect(promise).rejects.toBeInstanceOf(WhatsAppSendUnconfirmedError);
    await expect(promise).rejects.toThrow(/did not return the sent message for sendTextMessage to 34600000000@c\.us/);
  });

  it('throws the same clear error when the message comes back without id', async () => {
    sendMessage.mockResolvedValue({ id: {}, timestamp: 1 });

    await expect(adapter.sendTextMessage(chatId, 'hola')).rejects.toBeInstanceOf(WhatsAppSendUnconfirmedError);
  });
});

describe('serializeWaId', () => {
  it('prefers _serialized, falls back to $1 and tolerates missing ids', () => {
    expect(serializeWaId({ _serialized: 'a', $1: 'b' })).toBe('a');
    expect(serializeWaId({ $1: 'b' })).toBe('b');
    expect(serializeWaId({})).toBeUndefined();
    expect(serializeWaId(undefined)).toBeUndefined();
  });
});
