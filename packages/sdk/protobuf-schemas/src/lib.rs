// Re-export prost & tonic crates, so that users of this library can use the same versions seamlessly
pub use {prost, tonic};

pub mod dcc {
    tonic::include_proto!("dcc");

    pub mod events {
        tonic::include_proto!("dcc.events");

        pub mod grpc {
            tonic::include_proto!("dcc.events.grpc");
        }
    }

    pub mod node {
        pub mod grpc {
            // google.protobuf.UInt32Value maps to Rust's u32, but tonic codegen
            // emits `super::u32` inside nested client modules. Re-export the
            // primitive so generated code resolves correctly.
            #[allow(non_camel_case_types)]
            pub type u32 = core::primitive::u32;

            tonic::include_proto!("dcc.node.grpc");
        }
    }
}
