#[oph_macros::get_response]
fn handler(req: &oph::Request) -> oph::Response {

    oph::Response {
        status: oph::http::status::StatusCode::OK,
        headers: vec![("Content-Type".to_string(), "text/html".to_string())],
        body: b"<p>hello from raw-example!<p>".to_vec()
    }
}

// #[no_mangle]
// pub extern "C" fn __oph_function_get_response() -> usize {
//     let mut rs = oph::get_routing_state();
//     if let Some(ref request_bytes) = rs.request {
//         rs.response = match oph::serde_json::from_slice(request_bytes) {
//             Ok(request) => {
//                 match oph::serde_json::to_string(&handler(&request)) {
//                     Ok(json_str) => Some(json_str.as_bytes().to_vec()),
//                     Err(_) => Some("Failed to serialize response to string".bytes().collect()),
//                 }
//             },
//             Err(e) => Some(e.to_string().bytes().collect()),
//         };
//     }
//     0
// }
