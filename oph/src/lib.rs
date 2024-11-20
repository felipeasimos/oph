use std::sync::{Mutex, MutexGuard};
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Debug)]
struct Request {
    #[serde(with = "http_serde::method")]
    method: http::method::Method,
    #[serde(with = "http_serde::uri")]
    url: http::Uri,
    #[serde(with = "http_serde::version")]
    version: http::version::Version,
    headers: Vec<(String, String)>,
    body: Vec<u8>,
}

#[derive(Serialize, Deserialize, Debug)]
struct Response {
    #[serde(with = "http_serde::version")]
    version: http::version::Version,
    #[serde(with = "http_serde::method")]
    method: http::method::Method,
    #[serde(with = "http_serde::status_code")]
    status: http::status::StatusCode,
    headers: Vec<(String, String)>,
    body: Vec<u8>,
}

struct RoutingState {
    request: Option<Vec<u8>>,
    response: Option<Vec<u8>>,
}

static ROUTING_STATE: Mutex<RoutingState> = Mutex::new(RoutingState {
    request: None,
    response: None,
});

fn get_routing_state() -> MutexGuard<'static, RoutingState> {
    ROUTING_STATE.lock().unwrap()
}

#[no_mangle]
pub extern "C" fn allocate_request(size: usize) -> *mut u8 {
    let mut rs = get_routing_state();
    rs.request = Some(vec![0; size]);
    rs.request.as_mut().unwrap().as_mut_ptr()
}

fn handle_request(request: &Request) -> Vec<u8> {
    String::from("wtf is this working?").into_bytes()
}

#[no_mangle]
pub extern "C" fn fetch() -> usize {
    let mut rs = get_routing_state();
    if let Some(ref request_bytes) = rs.request {
        rs.response = match serde_json::from_slice(request_bytes) {
            Ok(request) => Some(handle_request(&request)),
            Err(_) => Some("Failed to parse request string from service worker js".bytes().collect()),
        };
    }
    0
}

#[no_mangle]
pub extern "C" fn response_ptr() -> *const u8 {
    let rs = get_routing_state();

    if let Some(r) = &rs.response {
        r.as_ptr()
    } else {
        0 as *const u8
    }
}

#[no_mangle]
pub extern "C" fn response_len() -> usize {
    let rs = get_routing_state();

    if let Some(r) = &rs.response {
        r.len()
    } else {
        0
    }
}
