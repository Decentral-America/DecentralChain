fn main() -> Result<(), Box<dyn std::error::Error>> {
    tonic_prost_build::configure()
        .build_server(false)
        .compile_protos(
            &[
                "proto/dcc/node/grpc/accounts_api.proto",
                "proto/dcc/node/grpc/assets_api.proto",
                "proto/dcc/node/grpc/blockchain_api.proto",
                "proto/dcc/node/grpc/blocks_api.proto",
                "proto/dcc/node/grpc/transactions_api.proto",
                "proto/dcc/events/events.proto",
                "proto/dcc/events/grpc/blockchain_updates.proto",
            ],
            &["proto"],
        )?;

    Ok(())
}
