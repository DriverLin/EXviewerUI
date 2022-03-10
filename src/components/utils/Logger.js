const post_remove = (...args) => {
    fetch('/api/logger', {
        method: 'POST',
        headers: {"content-type": "application/json"},
        body: JSON.stringify(args)
    })
}

export default function log(...args) {
    console.log("logger -- :",...args);
    // if (process.env.NODE_ENV === 'development') {
    //     post_remove(...args);
    // }
}