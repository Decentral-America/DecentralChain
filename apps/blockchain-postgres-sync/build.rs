use std::path::PathBuf;

fn main() {
    let proto_root = PathBuf::from("proto");

    let proto_files = &[
        proto_root.join("dcc/events/grpc/blockchain_updates.proto"),
        proto_root.join("dcc/events/events.proto"),
        proto_root.join("dcc/transaction.proto"),
        proto_root.join("dcc/block.proto"),
        proto_root.join("dcc/order.proto"),
        proto_root.join("dcc/invoke_script_result.proto"),
        proto_root.join("dcc/state_snapshot.proto"),
        proto_root.join("dcc/transaction_state_snapshot.proto"),
        proto_root.join("dcc/amount.proto"),
        proto_root.join("dcc/recipient.proto"),
        proto_root.join("dcc/reward_share.proto"),
    ];

    tonic_prost_build::configure()
        .build_server(false)
        .compile_protos(proto_files, &[proto_root])
        .expect("failed to compile proto files");
}
