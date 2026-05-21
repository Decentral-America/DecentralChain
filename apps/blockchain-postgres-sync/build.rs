use std::path::PathBuf;

fn main() {
    let proto_root = PathBuf::from("proto");

    let proto_files = &[
        proto_root.join("waves/events/grpc/blockchain_updates.proto"),
        proto_root.join("waves/events/events.proto"),
        proto_root.join("waves/transaction.proto"),
        proto_root.join("waves/block.proto"),
        proto_root.join("waves/order.proto"),
        proto_root.join("waves/invoke_script_result.proto"),
        proto_root.join("waves/state_snapshot.proto"),
        proto_root.join("waves/transaction_state_snapshot.proto"),
        proto_root.join("waves/amount.proto"),
        proto_root.join("waves/recipient.proto"),
        proto_root.join("waves/reward_share.proto"),
    ];

    tonic_prost_build::configure()
        .build_server(false)
        .compile_protos(proto_files, &[proto_root])
        .expect("failed to compile proto files");
}
