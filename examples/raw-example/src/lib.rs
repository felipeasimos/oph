#[oph_macros::get_response]
fn handler(req: oph::Request) -> oph::Response {

    oph::Response {
        status: oph::http::status::StatusCode::OK,
        headers: vec![("Content-Type".to_string(), "text/html".to_string())],
        body: b"<p>hello from raw-example!<p>".to_vec()
    }
}
