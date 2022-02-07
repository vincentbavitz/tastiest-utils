import { Horus } from '../../services/horus';

const TOKEN = `eyJhbGciOiJSUzI1NiIsImtpZCI6ImYyNGYzMTQ4MTk3ZWNlYTUyOTE3YzNmMTgzOGFiNWQ0ODg3ZWEwNzYiLCJ0eXAiOiJKV1QifQ.eyJlYXRlciI6dHJ1ZSwiaXNUZXN0QWNjb3VudCI6dHJ1ZSwiaXNzIjoiaHR0cHM6Ly9zZWN1cmV0b2tlbi5nb29nbGUuY29tL3Rhc3RpZXN0LWRpc2hlcyIsImF1ZCI6InRhc3RpZXN0LWRpc2hlcyIsImF1dGhfdGltZSI6MTY0NDI0ODY3OSwidXNlcl9pZCI6InVFbWtyRlNJRG9abUJhZGtJS1A3dXBNTWpVbzIiLCJzdWIiOiJ1RW1rckZTSURvWm1CYWRrSUtQN3VwTU1qVW8yIiwiaWF0IjoxNjQ0Mjc0NDI3LCJleHAiOjE2NDQyNzgwMjcsImVtYWlsIjoidmluY2VudEBiYXZpdHoub3JnIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZW1haWwiOlsidmluY2VudEBiYXZpdHoub3JnIl19LCJzaWduX2luX3Byb3ZpZGVyIjoicGFzc3dvcmQifX0.ZeN1WrWRtzHLW4bZDtzO0I5J40wBfysK-xZJBIZHECBl6L7ejGmRXHkBHc_1TLVRzttlHCv6EMsqXP-rM1qSxsXJ4-F_0cBeSTjxnM9nWxmnV4DQ04NUU_LZXY_vmmhWKZgXP05A6LmVSZtgQHQGES4QVw6NhTfsW4TTi29aBU__8qXCvIE_0-Yn9akp-oeQRqdz1Jj8SEbf1YD-1fMQO0WLb0MnE145Reo8LZXnwqRiX2Fclhz7zp44a3EB8-chD8FvT_98CUI4L1HQqzR7hGAmIsyGKgFG002iKXTd0WePsObNTPUMae0CLXa9ytdvwkRXvpR35KSTJDIXu31mBQ`;

describe('Test Horus', () => {
  // Remove window object in order to NodeFetch
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  //   const { window } = global;

  beforeAll(() => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    delete global.window;
  });

  // test('Restaurant Support Get', async () => {
  //   const horus = new Horus(TOKEN);

  //   const result = await horus.get(
  //     `/support/restaurants/ticket/95285be1-0beb-47ea-849d-41437c4afb2c`,
  //     { key: 14, bob: 'the-builder' },
  //   );

  //   dlog('horus.test ➡️ result:', result);

  //   expect(result.error).toBeNull();
  // });

  // test('Restaurant Support Reply', async () => {
  //   const horus = new Horus(TOKEN);

  //   const result = await horus.post('/support/restaurants/reply', {
  //     id: '95285be1-0beb-47ea-849d-41437c4afb2c',
  //     name: 'Numaaan33',
  //     message: 'Posting a reply again',
  //   });

  //   expect(result.error).toBeNull();
  // });

  test('Create New Order', async () => {
    const horus = new Horus(TOKEN);
    const { data, error } = await horus.post('/orders/new', {
      heads: 45,
      experienceId: 'v5WWg3Sr573AleBLH9LmH',
      bookedForTimestamp: 1644274766748,
    });

    console.log('horus.test ➡️ data:', data);
    console.log('horus.test ➡️ error:', error);
  });

  test('Get User', async () => {
    const horus = new Horus(TOKEN);

    const { data, error } = await horus.get('/users/333333');

    console.log('horus.test ➡️ data:', data);
    console.log('horus.test ➡️ error:', error);
  });
});
