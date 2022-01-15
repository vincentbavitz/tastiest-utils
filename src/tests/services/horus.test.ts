import { dlog } from '../..';
import { Horus } from '../../services/horus';

describe('Test Horus', () => {
  // Remove window object in order to NodeFetch
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  //   const { window } = global;

  beforeAll(() => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    delete global.window;
  });

  test('Restaurant Support Get', async () => {
    const token = `eyJhbGciOiJSUzI1NiIsImtpZCI6IjQwMTU0NmJkMWRhMzA0ZDc2NGNmZWUzYTJhZTVjZDBlNGY2ZjgyN2IiLCJ0eXAiOiJKV1QifQ.eyJyZXN0YXVyYW50Ijp0cnVlLCJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vdGFzdGllc3QtZGlzaGVzIiwiYXVkIjoidGFzdGllc3QtZGlzaGVzIiwiYXV0aF90aW1lIjoxNjQyMjY4MjI2LCJ1c2VyX2lkIjoidUNwWWtvdkNGUlU4OGtxWFhtVng5eWxtbm04MyIsInN1YiI6InVDcFlrb3ZDRlJVODhrcVhYbVZ4OXlsbW5tODMiLCJpYXQiOjE2NDIyNzE4MzgsImV4cCI6MTY0MjI3NTQzOCwiZW1haWwiOiJkZXZlbG9wZXJzQHRhc3RpZXN0LmlvIiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJmaXJlYmFzZSI6eyJpZGVudGl0aWVzIjp7ImVtYWlsIjpbImRldmVsb3BlcnNAdGFzdGllc3QuaW8iXX0sInNpZ25faW5fcHJvdmlkZXIiOiJwYXNzd29yZCJ9fQ.c5KZ5lOrds2NPd6dULIhXN-5AsmQkYIPJa4LDFN5LCQlC1wNnT2Q-9iW7dKQgHqZKBN3RRyrxlhr7QEWXjaBcMP2VoV9hsxJ_ABgsqlBFvBeHtKGfH2NHrjwuz4BRRPJSirJX-3QbmGFlj97k0SCnyWI0d-4KQ7B0pPoWvaG6kZPrIw7tKMGaRtW4ptDnnVlcea-315TBU6ktkH2WUjLxwmEW81w81lxyXu3iVaP3rrSix6uXXgLdawJedfE4cjEUPupHNb6ejZU4szyy1UcPWWb8MhehAUQhRKBtonn0pN4GQ-AK4IXH5x0x5NuVXo6G6PJSFHQL-JiupCHRKVEcw`;
    const horus = new Horus(token);

    const result = await horus.get(
      `/support/restaurants/ticket/95285be1-0beb-47ea-849d-41437c4afb2c`,
      { key: 14, bob: 'the-builder' },
    );

    dlog('horus.test ➡️ result:', result);

    expect(result.error).toBeNull();
  });

  test('Restaurant Support Reply', async () => {
    const token = `eyJhbGciOiJSUzI1NiIsImtpZCI6IjQwMTU0NmJkMWRhMzA0ZDc2NGNmZWUzYTJhZTVjZDBlNGY2ZjgyN2IiLCJ0eXAiOiJKV1QifQ.eyJyZXN0YXVyYW50Ijp0cnVlLCJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vdGFzdGllc3QtZGlzaGVzIiwiYXVkIjoidGFzdGllc3QtZGlzaGVzIiwiYXV0aF90aW1lIjoxNjQyMjY4MjI2LCJ1c2VyX2lkIjoidUNwWWtvdkNGUlU4OGtxWFhtVng5eWxtbm04MyIsInN1YiI6InVDcFlrb3ZDRlJVODhrcVhYbVZ4OXlsbW5tODMiLCJpYXQiOjE2NDIyNzE4MzgsImV4cCI6MTY0MjI3NTQzOCwiZW1haWwiOiJkZXZlbG9wZXJzQHRhc3RpZXN0LmlvIiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJmaXJlYmFzZSI6eyJpZGVudGl0aWVzIjp7ImVtYWlsIjpbImRldmVsb3BlcnNAdGFzdGllc3QuaW8iXX0sInNpZ25faW5fcHJvdmlkZXIiOiJwYXNzd29yZCJ9fQ.c5KZ5lOrds2NPd6dULIhXN-5AsmQkYIPJa4LDFN5LCQlC1wNnT2Q-9iW7dKQgHqZKBN3RRyrxlhr7QEWXjaBcMP2VoV9hsxJ_ABgsqlBFvBeHtKGfH2NHrjwuz4BRRPJSirJX-3QbmGFlj97k0SCnyWI0d-4KQ7B0pPoWvaG6kZPrIw7tKMGaRtW4ptDnnVlcea-315TBU6ktkH2WUjLxwmEW81w81lxyXu3iVaP3rrSix6uXXgLdawJedfE4cjEUPupHNb6ejZU4szyy1UcPWWb8MhehAUQhRKBtonn0pN4GQ-AK4IXH5x0x5NuVXo6G6PJSFHQL-JiupCHRKVEcw`;
    const horus = new Horus(token);

    const result = await horus.post('/support/restaurants/reply', {
      id: '95285be1-0beb-47ea-849d-41437c4afb2c',
      name: 'Numaaan33',
      message: 'Posting a reply again',
    });

    expect(result.error).toBeNull();
  });
});
