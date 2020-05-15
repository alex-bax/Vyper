import ast, os
from pprint import pprint

class AstParser():

    def __init__(self):
        self.funcNames = ""

        self.imports = []
        self.importsFrom = {}
        self.importStars = set()    #all module that imports *

        self.ifCount = 0
        self.ternIfCount = 0

        self.analyzer = Analyzer()

    def treeFromFile(self, filename):
        path = os.path.join("online_architecture_visualization/user-upload", filename) #open file saved in user-upload folder
        f = open(path, "r", encoding="utf8")
        try:
            tree =  ast.parse(f.read())
            return tree
        except Exception as e:
            print("--> AST Error: \n", e)
            return None

    #will do the parsing of the ast, and set state
    def parseTree(self, tree):
        self.analyzer.visit(tree)
        self.funcNames = self.analyzer.funcNames
        self.imports = self.analyzer.imports
        self.importsFrom = self.analyzer.importsFrom
        self.importStars = self.analyzer.importStars

        self.ifCount = self.analyzer.ifCount
        self.ternIfCount = self.analyzer.ternIfCount

    #LoC - No. lines wihtout comments or spaces
    def getNumOfLines(self):
        if (len(self.analyzer.numOfLines) > 0):
            return len(self.analyzer.numOfLines)
        else: return 0

    def getNumOfFuncs(self):
       return self.analyzer.getNumOfFuncs()

    def getDensity(self):
        return self.analyzer.density()

    def getNumFromImports(self):
        return self.analyzer.numFromImports()

    #after each iteration, the parser needs to reset its states
    def resetStates(self):
        self.analyzer.resetState()


class Analyzer(ast.NodeVisitor):
    def __init__(self):
        self.funcNames = ""

        self.imports = []
        self.importsFrom = {}   #k: from stmts, v: import stmts
        self.totalfromSize = 0    #size of all from-sets
        self.importStars = set()    #all module that imports *

        self.nodeCount = 0
        self.numOfLines = set() #NB - doesn't take into account empty lines in between actual lines!

        self.ifCount = 0
        self.ternIfCount = 0
        self.numOfFuncs = 0

    def resetState(self):
        self.imports = []
        self.importsFrom = {}
        self.importStars = set()
        self.totalfromSize = 0

        self.nodeCount = 0
        self.numOfLines = set() #NB - doesn't take into account empty lines in between actual lines!

        self.funcNames = ""
        self.numOfFuncs = 0
        self.ifCount = 0
        self.ternIfCount = 0

    def density(self):
        """density of code (nodes per line) in the visited AST"""
        # Divides nodeCount, with total unique number of lines (thus use of set)
        if(self.nodeCount > 0 and len(self.numOfLines) > 0):
            return round(self.nodeCount/len(self.numOfLines), 3)
        else:
            return 0

    def generic_visit(self, node):
        self.nodeCount += 1
        try:
            self.numOfLines.add(node.lineno) #add the node's linenum to the set
        except AttributeError:
            pass
        ast.NodeVisitor.generic_visit(self, node)

    def visit_FunctionDef(self, node):
        self.funcNames = self.funcNames + ", " +  node.name
        self.generic_visit(node)

    # every time the NodeVisitor meets a node, if it's an Import node type,
    # then call visit_import() and pass the node to it
    def visit_Import(self, node):
        for alias in node.names:
            self.imports.append(alias.name)
        self.generic_visit(node)

    def visit_ImportFrom(self, node):
        moduleName = node.module  #to be switched for relative imports e.g. 'from .. import x'
        if node.module is None and node.level: #check if relative and how many dots
            moduleName = self.dotStrBuilder(node.level)  #set moduleN to no. dots
            if moduleName not in self.importsFrom:
                self.importsFrom[moduleName] = set()

        elif node.module not in self.importsFrom:
            self.importsFrom[moduleName] = set()  #set of from-values

        for alias in node.names:
            self.importsFrom[moduleName].add(alias.name)
            if alias.name is "*":
                self.importStars.add(moduleName + ", ")   #add which import that imports *

        self.generic_visit(node)

    def dotStrBuilder(self, n):
        dot = ""
        for i in range(n):
            dot = dot + "."
        return dot

    def numFromImports(self):   #counts all from-imports
        self.totalfromSize = 0
        for imp in self.importsFrom:    #imp is 'from' in from-import statement
            self.totalfromSize += len(self.importsFrom[imp])

        return self.totalfromSize

    def visit_If(self, node):       #counts trad. if's incl. elif's
        self.ifCount += 1
        self.generic_visit(node)

    def visit_IfExp(self, node):    #counts ternary if's
        self.ternIfCount += 1
        self.generic_visit(node)

    def getNames(self):
        return self.funcNames

    def getNumOfFuncs(self): #empty arg means split on space
        return len(self.funcNames.split()) if len(self.funcNames) > 0 else 0
