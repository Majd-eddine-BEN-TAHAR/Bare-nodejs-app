function parseMultipart(data, boundary) {
  const boundaryBuffer = Buffer.from(`--${boundary}`);
  const endBoundaryBuffer = Buffer.from(`--${boundary}--`);

  let lastIndex = 0;
  let parts = {};

  while (lastIndex < data.length) {
    let boundaryIndex = data.indexOf(boundaryBuffer, lastIndex);

    if (boundaryIndex < 0) {
      break;
    }

    let endBoundaryIndex = data.indexOf(
      boundaryBuffer,
      boundaryIndex + boundaryBuffer.length
    );
    if (endBoundaryIndex < 0) {
      endBoundaryIndex = data.indexOf(
        endBoundaryBuffer,
        boundaryIndex + boundaryBuffer.length
      );
      if (endBoundaryIndex < 0) {
        break;
      }
    }

    const part = data
      .slice(boundaryIndex + boundaryBuffer.length, endBoundaryIndex)
      .toString();

    const headersEndIndex = part.indexOf("\r\n\r\n");
    if (headersEndIndex < 0) {
      break;
    }

    const headersPart = part.slice(0, headersEndIndex);
    const bodyPart = data.slice(
      headersEndIndex + 4 + boundaryIndex + boundaryBuffer.length,
      endBoundaryIndex
    );

    const headers = headersPart.split("\r\n");
    const contentDisposition = headers.find((header) =>
      header.startsWith("Content-Disposition:")
    );
    if (!contentDisposition) {
      lastIndex = endBoundaryIndex + boundaryBuffer.length;
      continue;
    }

    const nameMatch = /name="([^"]+)"/.exec(contentDisposition);
    const filenameMatch = /filename="([^"]+)"/.exec(contentDisposition);
    const contentTypeHeader = headers.find((header) =>
      header.startsWith("Content-Type:")
    );

    let contentType = contentTypeHeader
      ? contentTypeHeader.split(":")[1].trim()
      : "text/plain";
    // let content = Buffer.from(bodyPart, "binary");

    let content;
    if (filenameMatch) {
      // If it's a file, treat it as binary data
      content = Buffer.from(bodyPart, "binary");
    } else {
      // If it's not a file, convert it to a string
      content = Buffer.from(bodyPart, "binary").toString();
    }

    if (nameMatch) {
      const name = nameMatch[1];
      parts[name] = {
        content,
        filename: filenameMatch ? filenameMatch[1] : null,
        contentType,
      };
    }

    lastIndex = endBoundaryIndex + boundaryBuffer.length;
  }

  return parts;
}

module.exports = parseMultipart;
