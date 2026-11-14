/** Observe reward deposits separately from the run's earnings, restoring the method even on failure. */
export function rewardCoins(progress, action) {
  const add = progress.addCoins;
  let rewards = 0;
  progress.addCoins = function(n, earned = true) {
    if (!earned) rewards += n;
    return add.call(this, n, earned);
  };
  const restore = () => { progress.addCoins = add; };
  try {
    const pending = action();
    if (pending?.then) return pending.then(() => rewards).finally(restore);
    restore();
    return rewards;
  } catch (err) { restore(); throw err; }
}
