import sys
import zipfile
import xml.etree.ElementTree as ET

def read_docx(file_path):
    try:
        with zipfile.ZipFile(file_path) as docx:
            tree = ET.parse(docx.open('word/document.xml'))
            root = tree.getroot()
            
            # Word XML namespaces
            ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
            
            texts = []
            for para in root.findall('.//w:p', ns):
                para_text = []
                for run in para.findall('.//w:t', ns):
                    if run.text:
                        para_text.append(run.text)
                if para_text:
                    texts.append("".join(para_text))
            return "\n".join(texts)
    except Exception as e:
        return f"Error reading {file_path}: {e}"

if __name__ == "__main__":
    if len(sys.argv) > 1:
        print(read_docx(sys.argv[1]))
