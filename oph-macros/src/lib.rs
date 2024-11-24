extern crate proc_macro;

use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, ItemFn};

#[proc_macro_attribute]
pub fn get_response(_attr: TokenStream, item: TokenStream) -> TokenStream {
    let input = parse_macro_input!(item as ItemFn);
    let fn_name = &input.sig.ident;

    let output = quote! {
        #input

        #[no_mangle]
        pub extern "C" fn __oph_function_get_response() -> usize {
            let mut rs = oph::get_routing_state();
            if let Some(ref request_bytes) = rs.request {
                rs.response = match oph::serde_json::from_slice(request_bytes) {
                    Ok(request) => {
                        match oph::serde_json::to_string(&#fn_name(request)) {
                            Ok(json_str) => Some(json_str.as_bytes().to_vec()),
                            Err(_) => Some("Failed to serialize response to string".bytes().collect()),
                        }
                    },
                    Err(_) => Some("Failed to parse request from service worker js".bytes().collect()),
                };
            }
            0
        }
    };
    output.into()
}
