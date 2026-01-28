
An Introduction to ZPL

ZPL is a print language used by many label printers. A print language is a set of commands that can be used to draw elements like text, shapes, barcodes and images, combine these elements, and finally print them.

Imagine that you want to print a label containing a product name, a barcode for a SKU number, and a box around it all. You probably need to tell your printer:

    What the product name is, where to print it, and what font to use.
    What kind of barcode you want to use, where you want to place it, and the SKU number to encode.
    The box location, the box size, and the thickness of the box lines.

Below is an example of a ZPL label template that does just this. We'll break it down and review the details in the next sections.
^XA ^FO50,60^A0,40^FDWorld's Best Griddle^FS ^FO60,120^BY3^BCN,60,,,,A^FD1234ABC^FS ^FO25,25^GB380,200,2^FS ^XZ World's Best Griddle 1234ABC
Anatomy of a Label

First, some base rules:

    ZPL is composed of commands and command parameters.
    Commands start with a caret (^) or tilde (~) character.
    Command names follow the caret or tilde, are one or two letters long, and are case-insensitive (although uppercase names are most common).
    Commands can have a number of parameters, i.e. variable information which affects the behavior of the command.
    Command parameters are separated by comma (,) characters.
    Whitespace (spaces, tabs, newlines) is mostly ignored; the main exception is the ^FD command, covered below.

The example above can be confusing until you know what to look for. First, notice the ^XA command on line 1. This command signals the start of a label. Line 5 contains an ^XZ command, which signals the end of a label. These two commands, ^XA and ^XZ, serve as bookends to ZPL label definitions. Note that it is possible for a ZPL stream to contain more than one label definition, in which case the ZPL will contain a series of these ^XA + content + ^XZ sequences.

Lines 2 to 4 define the content of the label. Conceptually, label content is grouped into fields. The ^FS command is used to finish the current field and start a new field. Notice that lines 2 to 4 above all end with an ^FS command. Although not required, the label definition above is formatted in such a way that all commands relating to the same field are on the same line. The ^FS commands finish the current field and start the next field, which is then configured on the next line. This makes it easier to navigate and edit the label definition.

To summarize: line 1 starts the label, lines 2 to 4 define one field per line (3 fields total), and line 5 ends the label.
The Coordinate System

Lines 2 to 4 all start with an ^FO command, which sets the position of the current field (the Field Origin). This command takes two parameters: an X-coordinate and a Y-coordinate. The origin of the ZPL coordinate system is at the top left of the label, and the ^FO command sets the position of the top left of the current field, so ^FO0,0 would position the top left of the current field in the top left corner of the label.

The units of the label coordinate system are "dots", which are the smallest point which the printer is able to print. The physical size of a "dot" is different for different printer models, but the most common print density is 8 dpmm (8 dots per millimeter), or 203 dpi (203 dots per inch). Other print densities available include 6 dpmm (150 dpi), 12 dpmm (300 dpi) and 24 dpmm (600 dpi).

Because the label coordinate system is expressed in dots, and because the physical size of a dot varies according to the printer's print density, a label definition will print at different scales depending on the print density of the target printer. It is very important that the print density used to design a label matches the print density of the printer used to print that label. It is possible to change the unit system or set a custom scaling factor using the ^MU command, but it's not a common approach and is not usually necessary.
How to Draw Text

Let's examine line 2 from the example above. You'll notice that there are 4 commands: ^FO, ^A, ^FD and ^FS.

^FO 50, 60 ^A 0, 40 ^FD World's Best Griddle ^FS

As we've already seen, ^FO sets the field position. In this case, we are positioning the top left of the field at X-coordinate 50 (i.e. 50 dots to the right of the left edge) and Y-coordinate 60 (i.e. 60 dots down from the top edge).

The ^A command allows us to customize the font used to draw text. It can take up to 3 parameters: font name/orientation, font height, and font width. ZPL includes 16 fonts by default, each of which is referred to using a single letter or number. Font 0 is the most commonly used font -- it scales well to different sizes, it supports more international text than most of the other built-in fonts, and its design is very similar to Helvetica. We have also requested a font height of 40 dots, to make the text larger and easier to read. We have omitted the third parameter, the font width, which by default will scale to match the font height.

It is possible to upload custom fonts using the ~DU command and then give them short names using the ^CW command, but it is best to stick to the built-in fonts if possible. For more information about fonts, especially in the context of international text, please see our FAQ.

The ^FD command sets the Field Data. In this case, because we are drawing text, the field data is the text that will be printed in this field. The ^FD command takes a single parameter, in our case the string World's Best Griddle, which will be printed at the location specified by the ^FO command, using the font specified by the ^A command. Note that the ^FD command is one of the few places where whitespace is significant, so any spaces added between the command name (^FD) and the parameter (World's Best Griddle) would be incorporated into the parameter value and would affect the positioning of the text.

As mentioned previously, the ^FS command finishes the field and starts the next field.
How to Draw Barcodes

The next line in the example, line 3, adds a barcode to the label. You'll notice that there are 5 commands: ^FO, ^BY, ^BC, ^FD and ^FS.

^FO 60, 120 ^BY 3 ^BC , 60, , , , A ^FD 1234ABC ^FS

Because of the final ^FS command on the previous line, we are configuring a new field. The ^FO command places the top left of this second field at position (60, 120) within the label.

The ^BY command is a general barcode-related command that can be used to configure the module width (bar width), the module width ratio (the width of wide bars relative to narrow bars) and the module height (barcode height) for all barcode types. In this case, we are only using the first parameter to increase the bar width from 2 dots (the default) to 3 dots. This will make all subsequent barcodes wider (and easier for scanners to read).

The next command is the ^BC command, which indicates that this field generates a Code 128 barcode. Of the six parameters available to customize the behavior of this type of barcode, we are only using two: the second parameter indicates that the height of the barcode should be 60 dots, and the last parameter (A) indicates that the barcode should choose encoding modes automatically.

The next command, once again, is ^FD. However, this field will not print the field data as text (like the first field did). The presence of the ^BC command indicates that this data should be encoded in the Code 128 barcode. The field data is 1234ABC, so this is the data encoded in the barcode, and this is the information that will be captured by scanners reading the barcode.

Finally, the ^FS command signals the end of the current field and the implicit start of a new field.

Note that there are many types of barcodes, and in general there is one command for each type of barcode: ^BC for Code 128 barcodes, ^BO for Aztec barcodes, ^BQ for QR codes, ^BX for Data Matrix codes, ^B3 for Code 39 barcodes, etc. Each barcode command has different parameters available to control the barcode's appearance and behavior.

^BC orientation, height, showHumanReadableText, showTextAbove, addUccCheckDigit, mode [example]

^BO orientation, magnification, eci, size, readerInit, structuredAppendCount, structuredAppendMessageId [example]

^BQ orientation, model, magnification, errorCorrection, mask [example]

^BX orientation, height, qualityLevel, columns, rows, format, escape, aspectRatio [example]

^B3 orientation, addCheckDigit, height, showHumanReadableText, showTextAbove [example]
How to Draw Shapes

The third and final field draws a box around the label using 3 commands: ^FO, ^GB and ^FS.

^FO 25, 25 ^GB 380, 200, 2 ^FS

The ^FO command places the top left of the field at position (25, 25). The ^GB command indicates that the current field should draw a rectangle (a Graphical Box). The ^GB command takes 5 parameters, but we are only using the first three: we want our rectangle to be 380 dots wide, 200 dots high, and 2 dots thick. Finally, the ^FS command finishes the field.

ZPL supports a number of basic shapes, including circles (^GC), ellipses (^GE), diagonal lines (^GD), and rectangles/boxes (^GB). Each of these commands have different parameters which allow you to control the shapes' appearance. There is not a separate command to draw a simple horizontal or vertical line, but the ^GB command can be used for this purpose by drawing a rectangle with height = 1 (horizontal line) or width = 1 (vertical line).

^GC diameter, thickness, color [example]

^GE width, height, thickness, color [example]

^GD width, height, thickness, color, orientation [example]

^GB width, height, thickness, color, rounding [example]
How to Draw Images

Our basic example label definition did not include an embedded image, but there are a number of ways to add images to label definitions.

The most portable and maintainable approach is to use the ^GF command to indicate that the current field is an image (a Graphical Field). The ^GF command takes a number of parameters indicating the image format, the number of bytes, the number of bytes per row, etc. We recommend that you use format A (ASCII) in order to maximize maintainability and minimize compatibility issues.

^GF format, dataBytes, totalBytes, rowBytes [example]

It is also possible to use the ~DG or ~DY commands to upload images to the printer ahead of time and then refer to these images by path in your label definitions using the ^XG command. This can be helpful when print speed is of primary importance, but it sacrifices portability and maintainability.

If you need to quickly add an image to a label definition or generate the ^GF command for a specific image, we recommend that you use the "Add image" functionality available in the Labelary online ZPL viewer.
Other Common Commands

The ^CI command can be used to change the character encoding of the label definition. The ZPL default encoding is a variant of Cp-850. The Cp-850 encoding dates back to the 1980s and is not very common these days. In order to maximize portability and improve maintainability, we recommend that all label templates use the ^CI command to change their encoding to UTF-8. This can be done by adding ^CI28 at the top of the label definition. [example]

Sometimes many (or all) of the fields on a label use the same font. In these cases it can be tedious to repeat the same ^A command in every field. The ^CF command allows you to specify a default font and font size to be used by fields that do not specify a field font using the ^A command. [example]

You will sometimes need to include special characters in your label data, either to print as text or to encode in a barcode. This can cause issues, especially if you need to use the caret (^) or tilde (~) characters, which have special meaning in ZPL. The ^FH command can be used to specify an escape character which can then be used in your field data to enter the hexadecimal byte values of any special characters. [example]

Normally field content, like text or shapes, will be drawn in black. This is usually what you want, because the label background is white. There are scenarios, however, where you might want to draw white text or shapes over a black background. In these cases the ^FR (Field Reverse) command can be used to indicate that the content of the current field, when drawn, should reverse the existing color of any drawn dots -- dots that were white will become black (as usual), but dots that were black will become white. [example]

The ^FX command allows you to add comments to your labels. Comments do not affect the appearance of the label. [example]

The ^PM command allows you to mirror the label output, i.e. flip it horizontally. [example]

The ^PO command allows you to invert the label output vertically. [example]
Next Steps

The commands highlighted above will cover most needs. The examples linked throughout this document should provide a good basis for exploration and tweaking using the online ZPL viewer. Of course, there are many more ZPL commands available. The official ZPL programming guide can be very helpful if you need to dig deeper into the language.

Good luck, and happy hacking!
