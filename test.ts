import test from 'ava';
import axios from 'axios';
import { Session, SessionConfig } from './src';

let session: Session;

test.before(async () => {
    const authorizeURL = await axios
        .get('https://linky.bokub.vercel.app/api')
        .then((r) => r.data.match('var url = "(.+)"')[1]);
    const authorizeResult = await axios.get(authorizeURL).then((r) => r.data.response);
    const config: SessionConfig = {
        accessToken: authorizeResult.access_token,
        refreshToken: authorizeResult.refresh_token,
        usagePointId: authorizeResult.usage_points_id,
        sandbox: true,
    };
    session = new Session(config);
});

test('propagates errors', async (t) => {
    await t.throwsAsync(() => session.getDailyConsumption('2020-08-27', '2020-08-24'), {
        message: 'Invalid request: Start date should be before end date.',
    });
});

test('can retrieve daily consumption', async (t) => {
    const data = await session.getDailyConsumption('2020-08-27', '2020-08-30');
    t.is(data.unit, 'Wh');
    t.is(data.data.length, 3);
    t.deepEqual(
        data.data.map((d) => d.date),
        ['2020-08-27', '2020-08-28', '2020-08-29']
    );
});

test('can retrieve load curve', async (t) => {
    const data = await session.getLoadCurve('2020-08-27', '2020-08-28');
    t.is(data.unit, 'W');
    t.is(data.data.length, 48);
    t.is(data.data[0].date, '2020-08-27 00:00:00');
    t.is(data.data[3].date, '2020-08-27 01:30:00');
});
