use axum::{
    body::to_bytes, response::{Html, Response}, routing::get, Router
};
use futures_executor::block_on;
use http::Request;
use tower_service::Service;

async fn app(request: Request<String>) -> Response {
    let mut router = Router::new()
        .route("/hi", get(index));
    let response: Response = router.call(request).await.unwrap();
    response
}

async fn index() -> Html<&'static str> {
    Html("<h1>Hello, World! (from axum-example)</h1>")
}

#[oph_macros::get_response]
fn handler(req: oph::Request) -> oph::Response {

    let request: Request<String> = Request::builder()
        .uri(req.url.clone())
        .body(String::from_utf8(req.body.clone()).unwrap())
        .unwrap();
    let response = block_on(app(request));
    let headers = response
        .headers()
        .iter()
        .map(|(k, v)| {
            (k.to_string(), v.to_str().unwrap().to_string())
        })
        .collect();
    let status = response.status();
    let body = block_on(to_bytes(response.into_body(), 4096)).unwrap().to_vec();
    oph::Response {
        status,
        headers,
        body
    }
}
