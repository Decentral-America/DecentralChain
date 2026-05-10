/// Generated protobuf / tonic types for the DecentralChain / Waves blockchain protocol.
///
/// The .proto source files live in `proto/waves/` (bundled from
/// wavesplatform/protobuf-schemas) and are compiled at build time by
/// `build.rs` using `tonic-build`.  All generated modules are re-exported
/// here under the same `waves::*` path structure that the rest of the codebase
/// expects, so that a simple `use crate::proto::waves` replaces the old
/// `use waves_protobuf_schemas::waves` import.

pub mod waves {
    include!(concat!(env!("OUT_DIR"), "/waves.rs"));

    pub mod events {
        include!(concat!(env!("OUT_DIR"), "/waves.events.rs"));

        pub mod grpc {
            include!(concat!(env!("OUT_DIR"), "/waves.events.grpc.rs"));
        }
    }
}
