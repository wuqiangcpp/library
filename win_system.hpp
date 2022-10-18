#pragma once
#include <windows.h>
#include <ShellApi.h>
#include <shlobj_core.h>
std::wstring exePath() {
    TCHAR buffer[MAX_PATH] = { 0 };
    GetModuleFileName(NULL, buffer, MAX_PATH);
    std::wstring::size_type pos = std::wstring(buffer).find_last_of(L"\\/");
    return std::wstring(buffer).substr(0, pos);
}
HRESULT  browseToFile(LPCTSTR filename)
{
    int fail = S_OK; // start as 0
    fail = fail || CoInitialize(NULL);
    ITEMIDLIST* pidl = ILCreateFromPath(filename);
    if (pidl) {
        fail = fail || SHOpenFolderAndSelectItems(pidl, 0, 0, 0);
        ILFree(pidl);
        return fail;
    }
    else {
        return E_FAIL;
    }
}

void openFile(const std::wstring&file) {
    ShellExecute(GetDesktopWindow(), L"open", file.c_str(), NULL, NULL, SW_SHOWNORMAL);
}



bool openFileDialog(LPWSTR szFileName) {
    OPENFILENAME ofn;
    LPCWSTR FilterSpec = L"All Files(.)\0*.*\0";
    LPCWSTR Title = L"Open....";

    WCHAR szFileTitle[MAX_PATH];

    *szFileName = 0;

    /* fill in non-variant fields of OPENFILENAME struct. */
    ofn.lStructSize = sizeof(OPENFILENAME);
    ofn.hwndOwner = GetForegroundWindow();
    ofn.lpstrFilter = FilterSpec;
    ofn.lpstrCustomFilter = NULL;
    ofn.nMaxCustFilter = 0;
    ofn.nFilterIndex = 0;
    ofn.lpstrFile = szFileName;
    ofn.nMaxFile = MAX_PATH;
    ofn.lpstrInitialDir = L"."; // Initial directory.
    ofn.lpstrFileTitle = szFileTitle;
    ofn.nMaxFileTitle = MAX_PATH;
    ofn.lpstrTitle = Title;
    ofn.lpstrDefExt = 0; // I've set to null for demonstration
    ofn.Flags = OFN_FILEMUSTEXIST | OFN_HIDEREADONLY;

    // false if failed or cancelled
    return GetOpenFileName(&ofn);
}