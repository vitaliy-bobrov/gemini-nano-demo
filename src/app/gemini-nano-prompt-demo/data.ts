
export const rawLogInputExamples = [
  `Error: ENOENT: no such file or directory, open '/app/nonexistent-file.txt'\n    at Object.openSync (node:fs:590:18)\n    at readFileSync (node:fs:458:35)\n    at main (/app/index.js:10:20)\n    at Object.<anonymous> (/app/index.js:15:1)\n    at Module._compile (node:internal/modules/cjs/loader:1376:14)\n    at Module._extensions..js (node:internal/modules/cjs/loader:1435:10)\n    at Module.load (node:internal/modules/cjs/loader:1207:32)\n    at Module._load (node:internal/modules/cjs/loader:1023:12)\n    at Function.executeUserEntryPoint [as _executeUserEntryPoint] (node:internal/main/run_main:135:12)\n    at <anonymous> (node:internal/main/run_main_module:28:49)`,
  `Traceback (most recent call last):\n  File \"main.py\", line 5, in <module>\n    result = 1 / 0\nZeroDivisionError: division by zero`,
  `panic: runtime error: index out of range [10] with length 5\n\ngoroutine 1 [running]:\nmain.main()\n    /app/main.go:8 +0x39`,
  `[ERROR] 2025-09-21 15:30:10,123 [http-nio-8080-exec-5] o.a.c.c.C.[.[.[/].[dispatcherServlet] - Servlet.service() for servlet [dispatcherServlet] in context with path [] threw exception [Request processing failed; nested exception is java.lang.NullPointerException: Cannot read properties of null (reading 'getPricingDetails')] with root cause
java.lang.NullPointerException: Cannot read properties of null (reading 'getPricingDetails')
    at com.example.service.ProductService.calculateFinalPrice(ProductService.java:42)
    at com.example.controller.OrderController.submitOrder(OrderController.java:88)`,
];
