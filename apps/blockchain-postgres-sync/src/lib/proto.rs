//! Generated protobuf / tonic types for the `DecentralChain` blockchain protocol.
//!
//! The .proto source files live in `proto/dcc/` (bundled from
//! Decentral-America/protobuf-schemas) and are compiled at build time by
//! `build.rs` using `tonic-build`.  All generated modules are re-exported
//! here under the `dcc::*` path structure, so that a simple
//! `use crate::proto::dcc` imports all generated types.

pub mod dcc {
    // Generated code — suppress pedantic/nursery lints that don't apply.
    #![allow(clippy::pedantic, clippy::nursery)]
    include!(concat!(env!("OUT_DIR"), "/dcc.rs"));

    pub mod events {
        #![allow(clippy::pedantic, clippy::nursery, clippy::large_enum_variant)]
        include!(concat!(env!("OUT_DIR"), "/dcc.events.rs"));

        pub mod grpc {
            #![allow(clippy::pedantic, clippy::nursery)]
            include!(concat!(env!("OUT_DIR"), "/dcc.events.grpc.rs"));
        }
    }
}
