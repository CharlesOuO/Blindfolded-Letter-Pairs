package io.github.charlesouo.blindfoldedletterpairs;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

@CapacitorPlugin(name = "FileExporter")
public class FileExporterPlugin extends Plugin {
    @PluginMethod
    public void exportFile(PluginCall call) {
        String fileName = call.getString("fileName");
        String mimeType = call.getString("mimeType");
        if (fileName == null || fileName.isBlank()) fileName = "export.json";
        if (mimeType == null || mimeType.isBlank()) mimeType = "application/octet-stream";
        fileName = fileName.replace('\\', '_').replaceAll("[/:*?\"<>|]", "_");

        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType(mimeType);
        intent.putExtra(Intent.EXTRA_TITLE, fileName);
        startActivityForResult(call, intent, "handleExportResult");
    }

    @ActivityCallback
    private void handleExportResult(PluginCall call, ActivityResult result) {
        if (call == null) return;

        Intent resultData = result.getData();
        Uri destination = resultData == null ? null : resultData.getData();
        if (result.getResultCode() != Activity.RESULT_OK || destination == null) {
            JSObject response = new JSObject();
            response.put("saved", false);
            call.resolve(response);
            return;
        }

        String content = call.getString("content", "");
        try (OutputStream output = getContext().getContentResolver().openOutputStream(destination, "w")) {
            if (output == null) throw new IOException("Unable to open the selected file");
            output.write(content.getBytes(StandardCharsets.UTF_8));
            output.flush();

            JSObject response = new JSObject();
            response.put("saved", true);
            call.resolve(response);
        } catch (IOException error) {
            call.reject("Unable to export the selected file", error);
        }
    }
}
