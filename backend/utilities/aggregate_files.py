import os
import argparse

def aggregate_files(input_path, output_filename="output.txt"):
    """
    Aggregates the content of all files in a directory (and its subdirectories)
    into a single output file.

    Args:
        input_path (str): The path to the directory to scan.
        output_filename (str): The name of the output file to create.
    """
    if not os.path.isdir(input_path):
        print(f"Error: Input path '{input_path}' is not a valid directory.")
        return

    try:
        with open(output_filename, 'w', encoding='utf-8', errors='ignore') as outfile:
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

        print(f"Successfully aggregated files into {output_filename}")

    except Exception as e:
        print(f"Error creating or writing to output file {output_filename}: {e}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Aggregate content of files in a directory.")
    parser.add_argument("input_path", help="Path to the directory containing files to aggregate.")
    parser.add_argument("-o", "--output", default="output.txt", help="Name of the output file (default: output.txt)")

    args = parser.parse_args()
    
    # Handle potential single backslashes in Windows paths from CLI
    # No explicit handling needed here if os.path functions are used correctly.
    # os.path functions generally handle both / and \ on Windows.
    
    aggregate_files(args.input_path, args.output) 