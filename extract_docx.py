import zipfile
import xml.etree.ElementTree as ET

def get_docx_text(path):
    """
    Extracts text from a docx file.
    """
    try:
        with zipfile.ZipFile(path) as z:
            xml_content = z.read('word/document.xml')
        
        tree = ET.fromstring(xml_content)
        
        # Namespaces are important
        namespaces = {
            'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
        }
        
        paragraphs = []
        for p in tree.findall('.//w:p', namespaces):
            texts = [t.text for t in p.findall('.//w:t', namespaces) if t.text]
            if texts:
                paragraphs.append("".join(texts))
        
        return "\n".join(paragraphs)
    except Exception as e:
        return f"Error: {str(e)}"

if __name__ == "__main__":
    path = r'c:\Users\Kushhal S\OneDrive\Desktop\Pettikadai\south_indian_savory_catalog.docx'
    text = get_docx_text(path)
    with open(r'c:\Users\Kushhal S\OneDrive\Desktop\Pettikadai\catalog_text.txt', 'w', encoding='utf-8') as f:
        f.write(text)
    print("Done")
