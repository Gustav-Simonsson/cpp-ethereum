/*
	This file is part of cpp-ethereum.

	cpp-ethereum is free software: you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	cpp-ethereum is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.

	You should have received a copy of the GNU General Public License
	along with cpp-ethereum.  If not, see <http://www.gnu.org/licenses/>.
*/
/** @file ProjectModel.js
 * @author Arkadiy Paronyan arkadiy@ethdev.com
 * @date 2015
 * Ethereum IDE client.
 */

function saveAll() {
	saveProject();
}

function createProject() {
	newProjectDialog.open();
}

function closeProject() {
	if (!isEmpty) {
		if (haveUnsavedChanges)
			saveMessageDialog.open();
		else
			doCloseProject();
	}
}

function saveProject() {
	if (!isEmpty) {
		var projectData = { files: [] };
		for (var i = 0; i < projectListModel.count; i++)
			projectData.files.push(projectListModel.get(i).fileName)
		projectSaving(projectData);
		var json = JSON.stringify(projectData, null, "\t");
		var projectFile = projectPath + projectFileName;
		fileIo.writeFile(projectFile, json);
		projectSaved();
	}
}

function loadProject(path) {
	closeProject();
	console.log("loading project at " + path);
	var projectFile = path + projectFileName;
	var json = fileIo.readFile(projectFile);
	var projectData = JSON.parse(json);
	if (!projectData.title) {
		var parts = path.split("/");
		projectData.title = parts[parts.length - 2];
	}
	projectTitle = projectData.title;
	projectPath = path;
	if (!projectData.files)
		projectData.files = [];

	for(var i = 0; i < projectData.files.length; i++) {
		addFile(projectData.files[i]);
	}
	projectSettings.lastProjectPath = path;
	projectLoading(projectData);
	projectLoaded()
}

function addFile(fileName) {
	var p = projectPath + fileName;
	var extension = fileName.substring(fileName.lastIndexOf("."), fileName.length);
	var isContract = extension === ".sol";
	var isHtml = extension === ".html";
	var isCss = extension === ".css";
	var isJs = extension === ".js";
	var isImg = extension === ".png"  || extension === ".gif" || extension === ".jpg" || extension === ".svg";
	var syntaxMode = isContract ? "solidity" : isJs ? "javascript" : isHtml ? "htmlmixed" : isCss ? "css" : "";
	var groupName = isContract ? qsTr("Contracts") : isJs ? qsTr("Javascript") : isHtml ? qsTr("Web Pages") : isCss ? qsTr("Styles") : isImg ? qsTr("Images") : qsTr("Misc");
	var docData = {
		contract: false,
		path: p,
		fileName: fileName,
		name: isContract ? "Contract" : fileName,
		documentId: fileName,
		syntaxMode: syntaxMode,
		isText: isContract || isHtml || isCss || isJs,
		isContract: isContract,
		isHtml: isHtml,
		groupName: groupName
	};

	projectListModel.append(docData);
	return docData.documentId;
}

function getDocumentIndex(documentId)
{
	for (var i = 0; i < projectListModel.count; i++)
		if (projectListModel.get(i).documentId === documentId)
			return i;
	console.error("Cant find document " + documentId);
	return -1;
}

function openDocument(documentId) {
	if (documentId !== currentDocumentId) {
		documentOpened(projectListModel.get(getDocumentIndex(documentId)));
		currentDocumentId = documentId;
	}
}

function openNextDocument() {
	var docIndex = getDocumentIndex(currentDocumentId);
	var nextDocId = "";
	while (nextDocId === "") {
		docIndex++;
		if (docIndex >= projectListModel.count)
			docIndex = 0;
		var document = projectListModel.get(docIndex);
		if (document.isText)
			nextDocId = document.documentId;
	}
	openDocument(nextDocId);
}

function openPrevDocument() {
	var docIndex = getDocumentIndex(currentDocumentId);
	var prevDocId = "";
	while (prevDocId === "") {
		docIndex--;
		if (docIndex < 0)
			docIndex = projectListModel.count - 1;
		var document = projectListModel.get(docIndex);
		if (document.isText)
			prevDocId = document.documentId;
	}
	openDocument(prevDocId);
}

function doCloseProject() {
	console.log("closing project");
	projectListModel.clear();
	projectPath = "";
	currentDocumentId = "";
	projectClosed();
}

function doCreateProject(title, path) {
	closeProject();
	console.log("creating project " + title + " at " + path);
	if (path[path.length - 1] !== "/")
		path += "/";
	var dirPath = path + title + "/";
	fileIo.makeDir(dirPath);
	var projectFile = dirPath + projectFileName;

	var indexFile = "index.html";
	var contractsFile = "contracts.sol";
	var projectData = {
		title: title,
		files: [ contractsFile, indexFile ]
	};
	//TODO: copy from template
	fileIo.writeFile(dirPath + indexFile, "<html>\n<head>\n<script>\nvar web3 = parent.web3;\nvar theContract = parent.contract;\n</script>\n</head>\n<body>\n<script>\n</script>\n</body>\n</html>");
	fileIo.writeFile(dirPath + contractsFile, "contract Contract {\n}\n");
	newProject(projectData);
	var json = JSON.stringify(projectData, null, "\t");
	fileIo.writeFile(projectFile, json);
	loadProject(dirPath);
}

function doAddExistingFiles(files) {
	for(var i = 0; i < files.length; i++) {
		var sourcePath = files[i];
		var sourceFileName = sourcePath.substring(sourcePath.lastIndexOf("/") + 1, sourcePath.length);
		var destPath = projectPath + sourceFileName;
		if (sourcePath !== destPath)
			fileIo.copyFile(sourcePath, destPath);
		var id = addFile(sourceFileName);
		documentAdded(id)
	}
}

function renameDocument(documentId, newName) {
	var i = getDocumentIndex(documentId);
	var document = projectListModel.get(i);
	if (!document.isContract) {
		var sourcePath = document.path;
		var destPath = projectPath + newName;
		fileIo.moveFile(sourcePath, destPath);
		document.path = destPath;
		document.name = newName;
		projectListModel.set(i, document);
		documentUpdated(documentId);
	}
}

function getDocument(documentId) {
	var i = getDocumentIndex(documentId);
	return projectListModel.get(i);
}

function removeDocument(documentId) {
	var i = getDocumentIndex(documentId);
	var document = projectListModel.get(i);
	if (!document.isContract) {
		projectListModel.remove(i);
		documentRemoved(documentId);
	}
}

function newHtmlFile() {
	createAndAddFile("page", "html", "<html>\n</html>");
}

function newCssFile() {
	createAndAddFile("style", "css", "body {\n}\n");
}

function newJsFile() {
	createAndAddFile("script", "js", "function foo() {\n}\n");
}

function createAndAddFile(name, extension, content) {
	var fileName = generateFileName(name, extension);
	var filePath = projectPath + fileName;
	fileIo.writeFile(filePath, content);
	var id = addFile(fileName);
	documentAdded(id);
}

function generateFileName(name, extension) {
	var i = 1;
	do {
		var fileName = name + i + "." + extension;
		var filePath = projectPath + fileName;
		i++;
	} while (fileIo.fileExists(filePath));
	return fileName
}

