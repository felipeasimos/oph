pub use serde_json;
pub use http;
use serde::{Deserialize, Serialize};
use std::sync::{Mutex, MutexGuard};

#[derive(Serialize, Deserialize, Debug)]
pub struct Request {
    #[serde(with = "http_serde::method")]
    pub method: http::method::Method,
    #[serde(with = "http_serde::uri")]
    pub url: http::Uri,
    pub headers: Vec<(String, String)>,
    pub body: Vec<u8>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Response {
    #[serde(with = "http_serde::status_code")]
    pub status: http::status::StatusCode,
    pub headers: Vec<(String, String)>,
    pub body: Vec<u8>,
}

pub struct RoutingState {
    pub request: Option<Vec<u8>>,
    pub response: Option<Vec<u8>>,
}

static ROUTING_STATE: Mutex<RoutingState> = Mutex::new(RoutingState {
    request: None,
    response: None,
});

pub fn get_routing_state() -> MutexGuard<'static, RoutingState> {
    ROUTING_STATE.lock().unwrap()
}

#[no_mangle]
pub extern "C" fn __oph_function_allocate_request(size: usize) -> *mut u8 {
    let mut rs = get_routing_state();
    rs.request = Some(vec![0; size]);
    rs.request.as_mut().unwrap().as_mut_ptr()
}

#[no_mangle]
pub extern "C" fn __oph_function_get_response_ptr() -> *const u8 {
    let rs = get_routing_state();

    if let Some(r) = &rs.response {
        r.as_ptr()
    } else {
        0 as *const u8
    }
}

#[no_mangle]
pub extern "C" fn __oph_function_get_response_len() -> usize {
    let rs = get_routing_state();

    if let Some(r) = &rs.response {
        r.len()
    } else {
        0
    }
}
