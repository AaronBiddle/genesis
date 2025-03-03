import sys
import os

print("Python executable:", sys.executable)
print("Python version:", sys.version)
print("\nPYTHONHOME:", os.environ.get("PYTHONHOME", "Not set"))
print("PYTHONPATH:", os.environ.get("PYTHONPATH", "Not set"))

print("\nModule search paths (sys.path):")
for i, path in enumerate(sys.path):
    print(f"{i}: {path}")

print("\nStandard library location:")
import os.path
print(os.path.dirname(os.__file__))