use oph_macros::get_response;
use oph;
use axum::response::Response;

#[get_response]
fn handler(req: oph::Request) -> oph::Response {

    let mut router = Router::new().route("/api/", get(index));

    let response = router.call(request)
    response
}
