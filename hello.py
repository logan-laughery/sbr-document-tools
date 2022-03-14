
import time
 
# a module which has functions related to time.
# It can be installed using cmd command:
# pip install time, in the same way as pyautogui.
import pyautogui
import glob
import os
from subprocess import Popen

root_dir = 'C:/Users/Logan/Downloads/Open Records Reference Docs/FOIAs reduced'
files = glob.glob(root_dir + '/**/*.pdf', recursive=True)

for x in files:
    fileName = os.path.basename(x)
    path = x

def convertFile(fileName, path):
    print("Opening " + fileName)
    proc = Popen('"C:\\Program Files\\Adobe\\Acrobat DC\\Acrobat\\Acrobat.exe" /n "' + path + '"', shell=True)
    
    time.sleep(1)
    acrobatWindow = next(x for x in pyautogui.getAllWindows() if x.title.endswith("Adobe Acrobat Pro DC (64-bit)"))

    acrobatWindow = pyautogui.getWindowsWithTitle("Adobe Acrobat Pro DC (64-bit)")[0]
    acrobatWindow.maximize()
    acrobatWindow.activate()
    pyautogui.hotkey('ctrl', 'shift', 'f')
    time.sleep(1)
    pyautogui.write('test')
    time.sleep(1)
    pyautogui.press('enter')
    time.sleep(1)

    match = any(x.title == "No searchable text" for x in pyautogui.getAllWindows())

    if match:
        print("Found non searchable pdf")
        pyautogui.press('enter')
        pyautogui.press('enter')

        # may need to wait here until the conversion is complete
        time.sleep(4)
        pyautogui.hotkey('ctrl', 'shift', 's')
        
        time.sleep(1)

        pyautogui.press('enter')

        time.sleep(1)

        pyautogui.keyDown('winleft')
        pyautogui.press('left')
        pyautogui.keyUp('winleft')

        for x in pyautogui.getAllWindows():  
            print(x.title) 
    else:
        print("PDF was searchable")



convertFile(os.path.basename(files[0]), files[0])

# No searchable text
# for x in pyautogui.getAllWindows():  
#     print(x.title) 