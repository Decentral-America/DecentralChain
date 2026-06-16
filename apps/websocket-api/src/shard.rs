use std::hash::Hash;

/// A sharded container that distributes values across `N` buckets by key hash.
///
/// Reduces lock contention on hot paths by letting different keys hit different
/// buckets. Use [`Sharded::get`] to find the bucket for a given key.
///
/// Uses ahash for fast, non-cryptographic hashing with explicit stability guarantees.
/// The seed is randomised per process start so bucket assignment is not predictable
/// across restarts — this is intentional and prevents hash-flooding attacks.
#[derive(Debug)]
pub struct Sharded<T: Default> {
    size: u8,
    inner: Vec<T>,
    hash_state: ahash::RandomState,
}

impl<T: Default> Sharded<T> {
    #[must_use]
    pub fn new(size: u8) -> Self {
        assert!(size > 0, "shard count must be > 0");
        let mut inner = Vec::with_capacity(usize::from(size));
        for _ in 0..size {
            inner.push(T::default());
        }
        Self {
            size,
            inner,
            hash_state: ahash::RandomState::new(),
        }
    }

    /// Returns the shard bucket for the given key.
    #[inline]
    pub fn get<K: Hash>(&self, key: &K) -> &T {
        let hash = self.hash_state.hash_one(key);
        // `hash % size` is in [0, size) where size ≤ u8::MAX (255).
        // The result fits in usize on any platform; the expect never fires.
        let idx = usize::try_from(hash % u64::from(self.size))
            .expect("hash % size ≤ 254 always fits in usize");
        &self.inner[idx]
    }
}

impl<'a, T: Default> IntoIterator for &'a Sharded<T> {
    type Item = &'a T;
    type IntoIter = std::slice::Iter<'a, T>;

    fn into_iter(self) -> Self::IntoIter {
        self.inner.iter()
    }
}

#[cfg(test)]
#[allow(clippy::unwrap_used)]
mod tests {
    use super::*;
    use std::sync::Mutex;

    #[test]
    fn same_key_always_maps_to_same_shard() {
        let s = Sharded::<Mutex<Vec<u8>>>::new(2);
        let key = "deterministic";
        assert_eq!(Vec::<u8>::new(), *s.get(&key).lock().unwrap());
        s.get(&key).lock().unwrap().push(1);
        assert_eq!(vec![1u8], *s.get(&key).lock().unwrap());
    }

    #[test]
    fn iteration_covers_all_shards() {
        let s = Sharded::<Vec<u8>>::new(4);
        assert_eq!(s.into_iter().count(), 4);
    }
}
