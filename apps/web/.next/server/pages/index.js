"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "pages/index";
exports.ids = ["pages/index"];
exports.modules = {

/***/ "./pages/index.tsx":
/*!*************************!*\
  !*** ./pages/index.tsx ***!
  \*************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"react/jsx-dev-runtime\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ \"react\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var react_redux__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react-redux */ \"react-redux\");\n/* harmony import */ var react_redux__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react_redux__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var next_router__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! next/router */ \"next/router\");\n/* harmony import */ var next_router__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(next_router__WEBPACK_IMPORTED_MODULE_3__);\n\n\n\n\nconst Index = ()=>{\n    const router = (0,next_router__WEBPACK_IMPORTED_MODULE_3__.useRouter)();\n    const { isAuthenticated , token , user  } = (0,react_redux__WEBPACK_IMPORTED_MODULE_2__.useSelector)((state)=>state.auth);\n    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(()=>{\n        if (isAuthenticated && token) {\n            // Redirect GENERAL users to /order, ADMIN/SUPERADMIN to /dashboard\n            if (user?.role === \"GENERAL\") {\n                router.replace(\"/order\");\n            } else {\n                router.replace(\"/dashboard\");\n            }\n        } else {\n            router.replace(\"/auth/login\");\n        }\n    }, [\n        isAuthenticated,\n        token,\n        user,\n        router\n    ]);\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n        className: \"flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900\",\n        children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n            className: \"text-center\",\n            children: [\n                /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n                    className: \"h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto\"\n                }, void 0, false, {\n                    fileName: \"/mnt/c/Users/firma/works/Kranuan-Laboratory-Inventory/apps/web/pages/index.tsx\",\n                    lineNumber: 26,\n                    columnNumber: 17\n                }, undefined),\n                /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"p\", {\n                    className: \"mt-4 text-gray-500\",\n                    children: \"Redirecting...\"\n                }, void 0, false, {\n                    fileName: \"/mnt/c/Users/firma/works/Kranuan-Laboratory-Inventory/apps/web/pages/index.tsx\",\n                    lineNumber: 27,\n                    columnNumber: 17\n                }, undefined)\n            ]\n        }, void 0, true, {\n            fileName: \"/mnt/c/Users/firma/works/Kranuan-Laboratory-Inventory/apps/web/pages/index.tsx\",\n            lineNumber: 25,\n            columnNumber: 13\n        }, undefined)\n    }, void 0, false, {\n        fileName: \"/mnt/c/Users/firma/works/Kranuan-Laboratory-Inventory/apps/web/pages/index.tsx\",\n        lineNumber: 24,\n        columnNumber: 9\n    }, undefined);\n};\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Index);\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9wYWdlcy9pbmRleC50c3guanMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUE7QUFBa0M7QUFDUTtBQUNGO0FBR3hDLE1BQU1HLFFBQVEsSUFBTTtJQUNoQixNQUFNQyxTQUFTRixzREFBU0E7SUFDeEIsTUFBTSxFQUFFRyxnQkFBZSxFQUFFQyxNQUFLLEVBQUVDLEtBQUksRUFBRSxHQUFHTix3REFBV0EsQ0FBQyxDQUFDTyxRQUFzQkEsTUFBTUMsSUFBSTtJQUV0RlQsZ0RBQVNBLENBQUMsSUFBTTtRQUNaLElBQUlLLG1CQUFtQkMsT0FBTztZQUMxQixtRUFBbUU7WUFDbkUsSUFBSUMsTUFBTUcsU0FBUyxXQUFXO2dCQUMxQk4sT0FBT08sT0FBTyxDQUFDO1lBQ25CLE9BQU87Z0JBQ0hQLE9BQU9PLE9BQU8sQ0FBQztZQUNuQixDQUFDO1FBQ0wsT0FBTztZQUNIUCxPQUFPTyxPQUFPLENBQUM7UUFDbkIsQ0FBQztJQUNMLEdBQUc7UUFBQ047UUFBaUJDO1FBQU9DO1FBQU1IO0tBQU87SUFFekMscUJBQ0ksOERBQUNRO1FBQUlDLFdBQVU7a0JBQ1gsNEVBQUNEO1lBQUlDLFdBQVU7OzhCQUNYLDhEQUFDRDtvQkFBSUMsV0FBVTs7Ozs7OzhCQUNmLDhEQUFDQztvQkFBRUQsV0FBVTs4QkFBcUI7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBSWxEO0FBRUEsaUVBQWVWLEtBQUtBLEVBQUMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9AbGFib3JhdG9yeS93ZWIvLi9wYWdlcy9pbmRleC50c3g/MDdmZiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyB1c2VFZmZlY3QgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyB1c2VTZWxlY3RvciB9IGZyb20gJ3JlYWN0LXJlZHV4JztcbmltcG9ydCB7IHVzZVJvdXRlciB9IGZyb20gJ25leHQvcm91dGVyJztcbmltcG9ydCB7IElSb290U3RhdGUgfSBmcm9tICcuLi9zdG9yZSc7XG5cbmNvbnN0IEluZGV4ID0gKCkgPT4ge1xuICAgIGNvbnN0IHJvdXRlciA9IHVzZVJvdXRlcigpO1xuICAgIGNvbnN0IHsgaXNBdXRoZW50aWNhdGVkLCB0b2tlbiwgdXNlciB9ID0gdXNlU2VsZWN0b3IoKHN0YXRlOiBJUm9vdFN0YXRlKSA9PiBzdGF0ZS5hdXRoKTtcblxuICAgIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgICAgIGlmIChpc0F1dGhlbnRpY2F0ZWQgJiYgdG9rZW4pIHtcbiAgICAgICAgICAgIC8vIFJlZGlyZWN0IEdFTkVSQUwgdXNlcnMgdG8gL29yZGVyLCBBRE1JTi9TVVBFUkFETUlOIHRvIC9kYXNoYm9hcmRcbiAgICAgICAgICAgIGlmICh1c2VyPy5yb2xlID09PSAnR0VORVJBTCcpIHtcbiAgICAgICAgICAgICAgICByb3V0ZXIucmVwbGFjZSgnL29yZGVyJyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJvdXRlci5yZXBsYWNlKCcvZGFzaGJvYXJkJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByb3V0ZXIucmVwbGFjZSgnL2F1dGgvbG9naW4nKTtcbiAgICAgICAgfVxuICAgIH0sIFtpc0F1dGhlbnRpY2F0ZWQsIHRva2VuLCB1c2VyLCByb3V0ZXJdKTtcblxuICAgIHJldHVybiAoXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBtaW4taC1zY3JlZW4gaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGJnLWdyYXktNTAgZGFyazpiZy1ncmF5LTkwMFwiPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LWNlbnRlclwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiaC0xMiB3LTEyIGFuaW1hdGUtc3BpbiByb3VuZGVkLWZ1bGwgYm9yZGVyLTQgYm9yZGVyLXByaW1hcnkgYm9yZGVyLXQtdHJhbnNwYXJlbnQgbXgtYXV0b1wiPjwvZGl2PlxuICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cIm10LTQgdGV4dC1ncmF5LTUwMFwiPlJlZGlyZWN0aW5nLi4uPC9wPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBJbmRleDtcbiJdLCJuYW1lcyI6WyJ1c2VFZmZlY3QiLCJ1c2VTZWxlY3RvciIsInVzZVJvdXRlciIsIkluZGV4Iiwicm91dGVyIiwiaXNBdXRoZW50aWNhdGVkIiwidG9rZW4iLCJ1c2VyIiwic3RhdGUiLCJhdXRoIiwicm9sZSIsInJlcGxhY2UiLCJkaXYiLCJjbGFzc05hbWUiLCJwIl0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///./pages/index.tsx\n");

/***/ }),

/***/ "next/router":
/*!******************************!*\
  !*** external "next/router" ***!
  \******************************/
/***/ ((module) => {

module.exports = require("next/router");

/***/ }),

/***/ "react":
/*!************************!*\
  !*** external "react" ***!
  \************************/
/***/ ((module) => {

module.exports = require("react");

/***/ }),

/***/ "react-redux":
/*!******************************!*\
  !*** external "react-redux" ***!
  \******************************/
/***/ ((module) => {

module.exports = require("react-redux");

/***/ }),

/***/ "react/jsx-dev-runtime":
/*!****************************************!*\
  !*** external "react/jsx-dev-runtime" ***!
  \****************************************/
/***/ ((module) => {

module.exports = require("react/jsx-dev-runtime");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = (__webpack_exec__("./pages/index.tsx"));
module.exports = __webpack_exports__;

})();