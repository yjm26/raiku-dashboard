import assert from 'node:assert/strict';
import test from 'node:test';
import { applyYtTransactions, createYtLedger, ytEventsOf, ytHolders, ytMismatches } from './yt_ledger.mjs';

const VAULT = '5PvEneipr7VLDoPXdQBY7G2J3Wtzrdhg7WU181J9eXBy';
const ESCROW = 'HekaPxZKP4NfKuggPzYAxc91fg6uj1dr7BFgnhq6Dw1b';
const MATURITY = 1793440800;

// Real mainnet transactions on the YT-rkuSOL vault, trimmed to Exponent's events and the escrow's balances.
const DEPOSIT = {"signature":"4arsXSfAsDb4pjJ4NWpMbZky1uhYXH4fdDGsTquT7mvBymKu7fVyqnzKZnU8KBvwUYvLs4MLKACJPodpNngYGQ2m","slot":445058326,"blockTime":1788781882,"keys":["8Y7ApemW5UHzczZNYHW3tU4yZZjML8ho87i1dnf7kvw7","a2gdBQFXgzvYXdCZ1Hu3Yp9rv3heH8shku3gHSNjE17","AiURu6pyJjVypucEPsVZrkwxeft9Gg1WDXZBw3DDcMmB","41wB1tgVp4WmGTHTMeQnrc86okGixAwEtBvdLCBLmP8w","BtRJM6kHw9hEKZRPtkcNG5F1T5FxZrBwdBzUXzVo8WY2","6Wpp5nrd3GFBJRwWZEeT2Cohy19aww6wWQi8LZLkssk1","rkubjTrZYioRSeXwDnhwGQzvW3qkcin72JSxUt3WMVp","AjJ4wHQFVLGq8hLVfmhv3vCZNco98eoZAhD3ppyKBxTc","FcTYERGTnymbL1BDdXow9Z1RqZ1rE8AYbjs79d8hmGKq","FnQQXqv1mq5ZWvtXXmz21yr5ueFuvUMgTU4VSGDmEuoG","HekaPxZKP4NfKuggPzYAxc91fg6uj1dr7BFgnhq6Dw1b","ComputeBudget111111111111111111111111111111","ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL","SP12tWFxD9oJsVWNavTTBZvMbA6gkAmxtVgxdqvyvhY","F6LLwairYCMHoAZqRUbCD8HgXmPag1D6YVVKAkS5L4Jb","9BannfeCfdp8c9TMAAaoN3w66NsbpyZEi393QBsPB4W6","XPC1MM4dYACDfykNuXYZ5una2DsMDWL24CrYubCvarC","84nsuBADtkK8jwBrPFMiVVDm7PxN7Ytducf1Um7vxkYS","ERhozr6u9drmAANXGRNP1oh3quSqPKEwioKH5b8v9Kkt","61Dz6DkjDbn1seiD2SgDGpQE8V81ip22RyYwVsB9CcNy","7ak9bkcDdhWoWJR3Zy79T2TgpsbdTRHpZabC7iE1trQk","5u2hGnehUUuJWaUn1oiVWGRMSi5oatKam1ESwdiqhJuJ","3xqBKakX5MSoebtcKRvyf4sdWr9LzhnankJq1vW8XLHL","1Za6dEUDNJwBpjiJaRnJ7WtUpRNHjYH6dJTbR1gkzQN","58XmRhDKVsCEt6dD3zxqHth8uzMY8BHhEyeAiUa5UPw9","3bVyq1RKtEA8BkF21NU82Dk6erSXQbWnkhM4TsGgiD9i","5zcERAjxHZo689pUNTw1rVSqFtcwy2Q58TUeE8muo1CM","Eax7prksEBXCSHpJ3LcFgP9XkMzwtsLw7eZRBhaCVTBM","9Gmh8Ver72BD2bNFurB4uRX5Yxq8S3p6sV1ueZAQVgzM","5qzaXszCvUiHgybmr6q5oM34NGpJnU58epLs19aHsJGo","9a6TbjULRkoZrj3zwVFwdHWU4wyS2ksk3EyzZqKXEHbU","8X9EbLd5MSwGKXJJiNJKaUcdktACp5BEfyMoXBy8d4jc","BFFRmSjxmAyrE4aaUVoujrUMWaeQNKFnyQDJ4x35QVVU","5PvEneipr7VLDoPXdQBY7G2J3Wtzrdhg7WU181J9eXBy","EcQ3ZQu2E7L9vq4QGQHMovJ34vFFKYMppNGGzZmfRXWi","ELccf6nZUhXcjqTEuGHXTM1RMg15PCvPn2Xzh2WxRptW","11111111111111111111111111111111","TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA","3cEfD8fzb8YU96sBMrmJ5qZdGA2W1ft2UetpTBccvC7f","XP1BRLn8eCYSygrd8er5P4GKdzqKbC3DLoSsS5UYVZy","ExponentnaRg3CQbW6dqQNZKXp7gtZ9DGMp1cwC4HAS7","2xBrZFinVdw1Z88kBXcnTEw8TYr8WUUSJaNcrKB5pode","ALCnQBurdZ4bMZD7weGFXGcEruCYXKhHHXYtoPZJStp9","2qFqt7c5teKuuTMT7FCG24DzvsUwicuYovGpKAoB2XnK"],"inner":[{"index":7,"instructions":[{"programIdIndex":40,"data":"4cJRSEPwDAP1"},{"programIdIndex":40,"data":"K1NG6pNkt4GiWJV91VhPgCKwKZ6rD1qGeijCDTHqEbT5LC1TSiTkhudXytuytHdfeKyZXpjTRBq6B5QrA4qkuCwQUyCW81A8kK1XXaHwSfoy5NLE7T1cSQbugJBeCUx9yUDWWahJAgHoNdLW4HhQbkFgHHdNNk8CYwgcfiWriiBRERkn4NS9FpTA1xXCSEhiheVwqtcXjweKdLUPjyVoHLbKLw4Q54hXgdKVqLYETVE7zFJZoHh9ZnjSnPyCVfHFEG9hEufoP5m8vtEqPUfUkgSCg44HmdRysiwfvEfkAibgTzLpfdcrsji8nSuS6AxADzKs7b2q7k2zV8VcRBwwaLzjPsnfQ3vLAktqTiGR4et8YxQxqZiTeyuPtRaRz7jo5fhb8d1Yi3xVGezsvanE8TiDpv4VFTo3oeYgor6y6ZXs7onppwNraSLoYDizn9GzFJwnPYZSa3U3RizTyDyKoXGHcFnspQQheCEPnynnkBSmqCHTCh4PcLxBGRkW7HyGtpT4G6uDFCWzTnuScBUj9ZzNYC7MUjMy63M1AbQu2CtbazJ86PDRJusbBwVpmgHKeMhB2HmAtdFrGhFXn17NQHUKJBoLVdDggCFApdX8UH5ZpXR"},{"programIdIndex":40,"data":"6b3eiTGnKxw9"},{"programIdIndex":40,"data":"76MqH4YczmocAdAdrQTz73HF3VmhgGiYuDQJVs1GPiC7MvW6he2roVM3izoTg2YuDcNeZ726dUnPT6mzrKp4YbQb6rrqnEib97N75LYazcLev3mEZoeEWmviewYWuHh96ftKMDhDhZTRSUExfG6vEJuuZKdzUcFQmwtWtArMwhsUsNR8rpjDnzTkZjwpWgnnWbjRTj52JLamWpccxGjEjhzwvZQFqotmWuR1T8aF88xWasyUoBL3rndfBSnF4mtCNea8Rdbh2FVXqPPhJSth9eERNpvtsXr4ZsLX49fLjwL9fYDq1EaJbAaqitRi7VTEyiLQVVXXbmd5FbA4u5is1D7ka61V8Urfx4wPpGiu1YHMXUb3XfMiGKxAzbDxcdJou8cDgj38KPy8s3geUuiBks9HU7hkC7xrhptMG1p1kCZGgpYizDivpNRfegf"}]}],"pre":[{"accountIndex":10,"uiTokenAmount":{"amount":"30692860657442"}}],"post":[{"accountIndex":10,"uiTokenAmount":{"amount":"30693375923891"}}]};
const WITHDRAW = {"signature":"5BZbMgiAzpzGTLUwUTBWrG8TbWdiHWYEYJdbHgJJHceyaRvvF8KGo7HdcL6hn3JeCrGFhZT8mYd7PuW2EydAoRXb","slot":439412694,"blockTime":1786788162,"keys":["75c7bzBCLCS3kGNykcYUvnR4QEcZUV4WwyjWsDjwKser","ALb176GuSs9vG4itAtsLPeG62MdijVoWpgeXydv1H1cF","57eSoWoRxDFKKhncitauob7xVrWvEVCmwHPEui3hZban","Eo8L2duQDHhDtm5cycXCRHZ4kqFbhxgHmP9sSL3CwNpY","9Sp8yPVC2rzysSDSwwbFt8iK8SMpZ3obnuU9bXVZpUdo","rkubjTrZYioRSeXwDnhwGQzvW3qkcin72JSxUt3WMVp","BtRJM6kHw9hEKZRPtkcNG5F1T5FxZrBwdBzUXzVo8WY2","6Wpp5nrd3GFBJRwWZEeT2Cohy19aww6wWQi8LZLkssk1","HdWzETgz8UXYxMFPZj58WmiaV1ZE7GfZrscbNQbf9ahv","FcTYERGTnymbL1BDdXow9Z1RqZ1rE8AYbjs79d8hmGKq","9BRnz2h38A1mtPC8ugb6wzZ47eTJVZFmimeCjc65pk6h","HekaPxZKP4NfKuggPzYAxc91fg6uj1dr7BFgnhq6Dw1b","Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY","ComputeBudget111111111111111111111111111111","ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL","11111111111111111111111111111111","SP12tWFxD9oJsVWNavTTBZvMbA6gkAmxtVgxdqvyvhY","F6LLwairYCMHoAZqRUbCD8HgXmPag1D6YVVKAkS5L4Jb","9BannfeCfdp8c9TMAAaoN3w66NsbpyZEi393QBsPB4W6","XPC1MM4dYACDfykNuXYZ5una2DsMDWL24CrYubCvarC","ExponentnaRg3CQbW6dqQNZKXp7gtZ9DGMp1cwC4HAS7","84nsuBADtkK8jwBrPFMiVVDm7PxN7Ytducf1Um7vxkYS","3bVyq1RKtEA8BkF21NU82Dk6erSXQbWnkhM4TsGgiD9i","58XmRhDKVsCEt6dD3zxqHth8uzMY8BHhEyeAiUa5UPw9","ERhozr6u9drmAANXGRNP1oh3quSqPKEwioKH5b8v9Kkt","5zcERAjxHZo689pUNTw1rVSqFtcwy2Q58TUeE8muo1CM","BFFRmSjxmAyrE4aaUVoujrUMWaeQNKFnyQDJ4x35QVVU","9Gmh8Ver72BD2bNFurB4uRX5Yxq8S3p6sV1ueZAQVgzM","Eax7prksEBXCSHpJ3LcFgP9XkMzwtsLw7eZRBhaCVTBM","61Dz6DkjDbn1seiD2SgDGpQE8V81ip22RyYwVsB9CcNy","ELccf6nZUhXcjqTEuGHXTM1RMg15PCvPn2Xzh2WxRptW","7ak9bkcDdhWoWJR3Zy79T2TgpsbdTRHpZabC7iE1trQk","5PvEneipr7VLDoPXdQBY7G2J3Wtzrdhg7WU181J9eXBy","5u2hGnehUUuJWaUn1oiVWGRMSi5oatKam1ESwdiqhJuJ","EcQ3ZQu2E7L9vq4QGQHMovJ34vFFKYMppNGGzZmfRXWi","3xqBKakX5MSoebtcKRvyf4sdWr9LzhnankJq1vW8XLHL","1Za6dEUDNJwBpjiJaRnJ7WtUpRNHjYH6dJTbR1gkzQN","TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA","3cEfD8fzb8YU96sBMrmJ5qZdGA2W1ft2UetpTBccvC7f","XP1BRLn8eCYSygrd8er5P4GKdzqKbC3DLoSsS5UYVZy","2xBrZFinVdw1Z88kBXcnTEw8TYr8WUUSJaNcrKB5pode","ALCnQBurdZ4bMZD7weGFXGcEruCYXKhHHXYtoPZJStp9","2qFqt7c5teKuuTMT7FCG24DzvsUwicuYovGpKAoB2XnK"],"inner":[{"index":9,"instructions":[{"programIdIndex":20,"data":"76MqH4YczmocpFui3M4MMX1764WXoDgLBDVnzifNEbkJhid1WnpT8zi6RT1wSqcJwg1apBwzViDQGR42dW4Dg6yhkB9TBGp1SGQtjecUPCrqes8hBXSTeTSruPXABw29VhXkhwNvzsMR6fyfSGkdcbUUiL5fFNZprRp9YzkC5b1LM1ERb61T3vxpGcZfD9eeb28xYRTnYrErKakivEhXTUEsEeSev9rfPVeC7T1wymtNb2XJSrA8oEmar2SKczaWPCqRgKWwKwKfTbaahhpmjUg3Adi2G1M1cucnmECfv8e4HWJvM6JMjqipFmXPKav5W7SotExUNpgfVmUJnRsxLXeh6c3sYGYkfapTk1BeJ1AWAG9e7VVG32EgV7G8XGhbBRhXtAfoP3XPmuXtgzZgT3EznjFzrLszn8MAVsy8GXLX3J1SmYrsBMe25E7"}]},{"index":11,"instructions":[{"programIdIndex":20,"data":"54X96w3cBdXd"},{"programIdIndex":20,"data":"5cYMiLte5fVESRwViER3dYzfcrt4juNQNDQBu3qFFRjUWdk2yZPU7pZhxd4rKb3MJxDRuf8UeNPjvoyzUndbHZh1CBHNfR91YupRmHJnMYh19ZLPCATJn28tjsfPUiQP5Y2tMvRmb42XAc3M1UF1pBPYH97SyJQaWHq9Hc2wy9NGSNL8STvUdnVdXmAKoL3rCs3adRjhP1gcEZmuTSVamYf9hXV6QsrGsW1BzkDdHR7wtAxsUMfiPJaH5YJFUHgAF12z9GibybcjSneArHzBfhe2txUYTTBjidhT49vNj3EPJvjzjcVx89PfVfm2HnRmBvqCw7YBBECtnYvfNpAR8fWG9zWPe865Mik6Sr6deH4BePmQ48DjLnqmgJYCgGZzmHx3Y1Sb6UhRdxT1HMjT5czb1pPN8e1eBfffAzQwn8Ebq85SdgFXkr6M1bstKp29YNbTmYwSpxe5pWSZaES5WEVeMdaNcQ447tZyaQLW3Z3dLV8ZPPrkmhACAmGUHLtHNW7Pp9ZChdAjyNMJp1TfsM4dVB1QvKToT7HUJgtUPiJAkkmbH2eDt9sR3PRbE4wpPU1Jo"},{"programIdIndex":20,"data":"21448NTnPMYUBey1Bo1DJoXStmdLga6jad1VZTisVaGTZKj2T7Lv8W3TCCmd2m1V249XHx9pstAxM4cbtHN8jLZbq5LS2wN6JYWQzTNDSTemxECWgqpuyt3C5bU1pue5mdtdY4BHCvBCQM5"}]}],"pre":[{"accountIndex":11,"uiTokenAmount":{"amount":"33261293382037"}}],"post":[{"accountIndex":11,"uiTokenAmount":{"amount":"33175620982037"}}]};
const asRpc = (t) => ({ transaction: { message: { accountKeys: t.keys } }, meta: { innerInstructions: t.inner, loadedAddresses: { writable: [], readonly: [] }, preTokenBalances: t.pre, postTokenBalances: t.post } });

test('decodes a real YT deposit and matches the escrow change', () => {
  const { events, escrowDelta, eventDelta } = ytEventsOf(asRpc(DEPOSIT), { vault: VAULT, escrow: ESCROW });
  assert.equal(events.length, 1);
  assert.equal(events[0].kind, 'deposit');
  assert.equal(events[0].signer, '8Y7ApemW5UHzczZNYHW3tU4yZZjML8ho87i1dnf7kvw7');
  assert.equal(events[0].amount, 515266449n);
  assert.equal(events[0].balanceAfter, 515266449n);
  assert.equal(escrowDelta, 515266449n);
  assert.equal(eventDelta, escrowDelta);
});

test('decodes a real YT withdrawal and matches the escrow change', () => {
  const { events, escrowDelta, eventDelta } = ytEventsOf(asRpc(WITHDRAW), { vault: VAULT, escrow: ESCROW });
  assert.equal(events[0].kind, 'withdraw');
  assert.equal(events[0].signer, '75c7bzBCLCS3kGNykcYUvnR4QEcZUV4WwyjWsDjwKser');
  assert.equal(events[0].amount, 85672400000n);
  assert.equal(events[0].balanceAfter, 652043833n);
  assert.equal(escrowDelta, -85672400000n);
  assert.equal(eventDelta, escrowDelta);
  assert.deepEqual(ytEventsOf(asRpc(WITHDRAW), { vault: 'another-vault', escrow: ESCROW }).events, []);
});

const DAY = 86_400;
const T0 = 1_780_000_000;
const tx = (sig, time, events, escrowDelta) => {
  const eventDelta = events.reduce((sum, e) => sum + (e.kind === 'deposit' ? e.amount : e.kind === 'withdraw' ? -e.amount : 0n), 0n);
  return { sig, slot: time, time, events, eventDelta, escrowDelta: escrowDelta ?? eventDelta };
};
const yt = (n) => BigInt(n) * 1_000_000_000n;
const move = (kind, amount, after, signer = 'wallet-a', position = 'pos-a') => ({ kind, signer, vault: VAULT, position, amount: yt(amount), balanceAfter: yt(after) });

test('YT-days follow the balance over time, and the withdrawal signer is the owner', () => {
  const ledger = createYtLedger({ vault: VAULT, escrow: ESCROW, maturity: MATURITY });
  applyYtTransactions(ledger, [
    tx('s1', T0, [move('deposit', 10, 10, 'relayer')]),
    tx('s2', T0 + DAY, [move('withdraw', 4, 6, 'wallet-a')]),
  ]);
  const [row] = ytHolders(ledger, T0 + 3 * DAY);
  assert.equal(row.owner, 'wallet-a');
  assert.equal(row.yt, 6);
  assert.equal(row.ytDays, 10 * 1 + 6 * 2);
  assert.equal(row.first, T0);
  assert.deepEqual(ledger.breaks, []);
  assert.deepEqual(ledger.txMismatches, []);
});

test('a balance that does not follow from the one before is recorded as a break', () => {
  const ledger = createYtLedger({ vault: VAULT, escrow: ESCROW, maturity: MATURITY });
  applyYtTransactions(ledger, [tx('s1', T0, [move('deposit', 10, 10)]), tx('s2', T0 + DAY, [move('deposit', 5, 20)], yt(5))]);
  assert.deepEqual(ledger.breaks, [{ position: 'pos-a', sig: 's2' }]);
  applyYtTransactions(ledger, [tx('s3', T0 + 2 * DAY, [move('deposit', 1, 21)], yt(2))]);
  assert.deepEqual(ledger.txMismatches, ['s3']);
});

test('nothing accrues after maturity', () => {
  const ledger = createYtLedger({ vault: VAULT, escrow: ESCROW, maturity: T0 + 2 * DAY });
  applyYtTransactions(ledger, [tx('s1', T0, [move('deposit', 3, 3)])]);
  assert.equal(ytHolders(ledger, T0 + 10 * DAY)[0].ytDays, 6);
});

test('replayed balances are compared with the live positions', () => {
  const ledger = createYtLedger({ vault: VAULT, escrow: ESCROW, maturity: MATURITY });
  applyYtTransactions(ledger, [tx('s1', T0, [move('deposit', 10, 10), move('deposit', 2, 2, 'wallet-b', 'pos-b')])]);
  assert.deepEqual(ytMismatches(ledger, { 'pos-a': String(yt(10)), 'pos-b': String(yt(2)) }), []);
  assert.deepEqual(ytMismatches(ledger, { 'pos-a': String(yt(9)) }), ['pos-a', 'pos-b']);
  // The vault's own position for unstaked YT is not replayed, so it is never compared.
  const withVault = createYtLedger({ vault: VAULT, escrow: ESCROW, maturity: MATURITY, vaultPosition: 'vault-pos' });
  assert.deepEqual(ytMismatches(withVault, { 'vault-pos': String(yt(6)) }), []);
});
