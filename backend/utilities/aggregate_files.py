import os
import argparse
from pathlib import Path

def aggregate_files(input_path, output_filename="output.txt"):
    """
    Aggregates the content of all files in a directory (and its subdirectories)
    into a single output file located in the 'userdata' directory at the project root.

    Args:
        input_path (str): The path to the directory to scan.
        output_filename (str): The name of the output file to create within the 'userdata' directory.
    """
    if not os.path.isdir(input_path):
        print(f"Error: Input path '{input_path}' is not a valid directory.")
        return

    try:
        # Determine project root and userdata directory
        script_dir = Path(__file__).resolve().parent
        project_root = script_dir.parent.parent
        output_dir = project_root / 'userdata'

        # Create the output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)

        # Construct the full output path
        full_output_path = output_dir / output_filename

        with open(full_output_path, 'w', encoding='utf-8', errors='ignore') as outfile:
            # Convert input_path to an absolute path for reliable relative path calculation
            abs_input_path = os.path.abspath(input_path)
            
            for root, _, files in os.walk(input_path):
                for filename in files:
                    file_path = os.path.join(root, filename)
                    # Calculate relative path from the original input path
                    relative_path = os.path.relpath(file_path, input_path)

                    try:
                        header = f"**********\n{relative_path}\n**********\n"
                        outfile.write(header)
                        
                        with open(file_path, 'r', encoding='utf-8', errors='ignore') as infile:
                            content = infile.read()
                            outfile.write(content)
                            outfile.write("\n\n") # Add extra newline for separation

                    except Exception as e:
                        print(f"Error processing file {file_path}: {e}")
                        outfile.write(f"**********\nError reading: {relative_path}\n**********\n{e}\n\n")

        print(f"Successfully aggregated files into {full_output_path}")

    except Exception as e:
        print(f"Error creating or writing to output file {full_output_path}: {e}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Aggregate content of files in a directory into project_root/userdata/.")
    parser.add_argument("input_path", help="Path to the directory containing files to aggregate.")
    parser.add_argument("-o", "--output", default="output.txt", help="Name of the output file within the 'userdata' directory (default: output.txt)")

    args = parser.parse_args()
    
    # Handle potential single backslashes in Windows paths from CLI
    # No explicit handling needed here if os.path functions are used correctly.
    # os.path functions generally handle both / and \ on Windows.
    
    aggregate_files(args.input_path, args.output) 