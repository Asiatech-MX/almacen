using System;
using System.Drawing;
using System.Drawing.Printing;
using System.IO;
using System.Runtime.InteropServices;

public class BrotherPrinter
{
    [DllImport("winspool.drv", CharSet = CharSet.Auto, SetLastError = true)]
    public static extern bool OpenPrinter(string printerName, out IntPtr hPrinter, IntPtr pDefault);

    [DllImport("winspool.drv", CharSet = CharSet.Auto, SetLastError = true)]
    public static extern bool ClosePrinter(IntPtr hPrinter);

    [DllImport("winspool.drv", CharSet = CharSet.Auto, SetLastError = true)]
    public static extern bool StartDocPrinter(IntPtr hPrinter, int level, ref DOCINFOA di);

    [DllImport("winspool.drv", CharSet = CharSet.Auto, SetLastError = true)]
    public static extern bool EndDocPrinter(IntPtr hPrinter);

    [DllImport("winspool.drv", CharSet = CharSet.Auto, SetLastError = true)]
    public static extern bool StartPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.drv", CharSet = CharSet.Auto, SetLastError = true)]
    public static extern bool EndPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.drv", CharSet = CharSet.Auto, SetLastError = true)]
    public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, int dwCount, out int dwWritten);

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Auto)]
    public struct DOCINFOA
    {
        [MarshalAs(UnmanagedType.LPStr)]
        public string pDocName;
        [MarshalAs(UnmanagedType.LPStr)]
        public string pOutputFile;
        [MarshalAs(UnmanagedType.LPStr)]
        public string pDataType;
    }

    public static object PrintLabel(dynamic input)
    {
        try
        {
            string pdfPath = (string)input.pdfPath;
            string printerName = (string)input.printerName;
            double widthMm = (double)input.widthMm;
            double heightMm = (double)input.heightMm;

            // Verificar si el archivo existe
            if (!File.Exists(pdfPath))
            {
                return new { success = false, error = "Archivo PDF no encontrado: " + pdfPath };
            }

            // Verificar si la impresora existe
            bool printerExists = false;
            foreach (string printer in PrinterSettings.InstalledPrinters)
            {
                if (printer.Equals(printerName, StringComparison.OrdinalIgnoreCase))
                {
                    printerExists = true;
                    break;
                }
            }

            if (!printerExists)
            {
                return new { success = false, error = "Impresora no encontrada: " + printerName };
            }

            // Configurar impresión
            PrintDocument pd = new PrintDocument();
            pd.PrinterSettings.PrinterName = printerName;
            pd.PrintController = new StandardPrintController();

            // Configurar tamaño de página personalizado si es necesario
            if (widthMm > 0 && heightMm > 0)
            {
                // Convertir mm a hundredths of an inch (1 pulgada = 25.4 mm)
                float widthIn = (float)(widthMm / 25.4 * 100);
                float heightIn = (float)(heightMm / 25.4 * 100);

                // Buscar tamaño de papel personalizado o crear uno
                PaperSize customSize = null;
                foreach (PaperSize size in pd.PrinterSettings.PaperSizes)
                {
                    if (Math.Abs(size.Width - widthIn) < 5 && Math.Abs(size.Height - heightIn) < 5)
                    {
                        customSize = size;
                        break;
                    }
                }

                if (customSize != null)
                {
                    pd.DefaultPageSettings.PaperSize = customSize;
                }
                else
                {
                    // Usar tamaño personalizado
                    pd.DefaultPageSettings.PaperSize = new PaperSize("Custom", widthIn, heightIn);
                }
            }

            // Variables para capturar el resultado
            bool printSuccess = true;
            string errorMessage = null;

            // Event handlers
            pd.PrintPage += (sender, e) => {
                try
                {
                    // Para etiquetas simples, imprimir texto de prueba
                    // En una implementación real, aquí se renderizaría el PDF
                    Font font = new Font("Arial", 8);
                    Brush brush = new SolidBrush(Color.Black);
                    PointF location = new PointF(10, 10);

                    e.Graphics.DrawString("TEST LABEL - " + DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"), font, brush, location);

                    // Dibujar un rectángulo para representar los límites
                    e.Graphics.DrawRectangle(Pens.Black, e.PageBounds);
                }
                catch (Exception ex)
                {
                    printSuccess = false;
                    errorMessage = ex.Message;
                }
            };

            pd.Print();

            if (printSuccess)
            {
                return new {
                    success = true,
                    message = "Etiqueta enviada a impresión correctamente",
                    printer = printerName,
                    dimensions = new { width = widthMm, height = heightMm }
                };
            }
            else
            {
                return new {
                    success = false,
                    error = errorMessage ?? "Error desconocido durante la impresión"
                };
            }
        }
        catch (Exception ex)
        {
            return new { success = false, error = ex.Message };
        }
    }

    public static object GetPrinters()
    {
        try
        {
            var printers = new System.Collections.Generic.List<object>();

            foreach (string printerName in PrinterSettings.InstalledPrinters)
            {
                var ps = new PrinterSettings { PrinterName = printerName };

                printers.Add(new {
                    name = printerName,
                    isValid = ps.IsValid,
                    canDuplex = ps.CanDuplex,
                    maxCopies = ps.MaximumCopies,
                    isDefault = printerName.Equals(new PrinterSettings().PrinterName, StringComparison.OrdinalIgnoreCase)
                });
            }

            return new { success = true, printers = printers.ToArray() };
        }
        catch (Exception ex)
        {
            return new { success = false, error = ex.Message };
        }
    }

    public static object PrintPDFWithSystem(dynamic input)
    {
        try
        {
            string pdfPath = (string)input.pdfPath;
            string printerName = (string)input.printerName;

            if (!File.Exists(pdfPath))
            {
                return new { success = false, error = "Archivo no encontrado" };
            }

            // Usar el comando de Windows para imprimir PDF
            var processInfo = new System.Diagnostics.ProcessStartInfo
            {
                FileName = "cmd.exe",
                Arguments = $"/C \"\"{pdfPath}\"\"",
                CreateNoWindow = true,
                UseShellExecute = true,
                Verb = "printto",
                WindowStyle = System.Diagnostics.ProcessWindowStyle.Hidden
            };

            // Si se especifica impresora, agregarla como parámetro
            if (!string.IsNullOrEmpty(printerName))
            {
                processInfo.Arguments = $"/C \"\"{pdfPath}\" \"{printerName}\"\"";
            }

            using (var process = System.Diagnostics.Process.Start(processInfo))
            {
                process.WaitForExit(10000); // Esperar máximo 10 segundos

                if (process.HasExited)
                {
                    return new { success = true, message = "PDF enviado a impresión" };
                }
                else
                {
                    process.Kill();
                    return new { success = false, error = "Timeout esperando impresión" };
                }
            }
        }
        catch (Exception ex)
        {
            return new { success = false, error = ex.Message };
        }
    }
}