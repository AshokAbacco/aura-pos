package com.abaccotech.saloraglam;

import android.content.Context;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.webkit.WebView;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Android's WebView ignores window.print(). This plugin sends the page that is on screen to
 * Android's print service, which can save a PDF or print to a Wi-Fi / Bluetooth printer that has
 * a print-service app installed. The page's @media print CSS is used, so only the receipt prints.
 * Called from JavaScript as Printer.print({ name }) — see client/src/lib/native.js.
 */
@CapacitorPlugin(name = "Printer")
public class PrinterPlugin extends Plugin {

    @PluginMethod
    public void print(PluginCall call) {
        final String jobName = call.getString("name", "Aura POS");
        getActivity().runOnUiThread(() -> {
            try {
                WebView webView = getBridge().getWebView();
                PrintManager printManager = (PrintManager) getActivity().getSystemService(Context.PRINT_SERVICE);
                PrintDocumentAdapter adapter = webView.createPrintDocumentAdapter(jobName);
                printManager.print(jobName, adapter, new PrintAttributes.Builder().build());
                call.resolve();
            } catch (Exception e) {
                call.reject("Could not open the print dialog: " + e.getMessage(), e);
            }
        });
    }
}