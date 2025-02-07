import subprocess
import os
import time
import argparse

def get_git_file_info():
    """Retrieves file information from git ls-tree, handling trees (directories)."""

    try:
        result = subprocess.run(['git', 'ls-tree', '-r', 'HEAD', '--long'], capture_output=True, text=True, check=True)
        output = result.stdout
    except subprocess.CalledProcessError as e:
        print(f"Error running git ls-tree: {e}")
        return []

    file_info = []
    for line in output.strip().split('\n'):
        if not line:  # Skip empty lines
            continue
            
        # The format is: <mode> <type> <object> <size> <path>
        # We'll split by whitespace, but only for the first 4 parts
        parts = line.split(None, 4)
        
        if len(parts) == 5:  # Make sure we have all parts
            object_type = parts[1]
            if object_type == "blob":
                try:
                    size = int(parts[3])  # Size is the fourth field (index 3)
                    filename = parts[4]    # Everything else is the filename
                    file_info.append({
                        'path': filename,
                        'size': size
                    })
                except ValueError:
                    print(f"Warning: Could not parse size for file {parts[4]}")
                    continue

    return file_info


def get_file_date(filepath):
  """Retrieves the last modified date of a file."""
  try:
    timestamp = os.path.getmtime(filepath)
    date = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(timestamp))
    return date
  except FileNotFoundError:
    return "Date not found"


def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='Display git repository file information.')
    parser.add_argument('-m', type=int, help='Show only the N largest files')
    return parser.parse_args()


def format_size(size_in_bytes):
    """Convert size in bytes to human readable format."""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_in_bytes < 1024.0:
            return f"{size_in_bytes:.1f} {unit}"
        size_in_bytes /= 1024.0
    return f"{size_in_bytes:.1f} TB"


def main():
    args = parse_args()
    file_info = get_git_file_info()
    
    # Add dates to file_info
    for file in file_info:
        file['date'] = get_file_date(file['path'])
    
    # Sort by date first
    sorted_files = sorted(file_info, key=lambda x: x['date'])
    
    # If -m flag is used, keep only the N largest files
    if args.m:
        # Sort by size (largest first) and take first N files
        sorted_files = sorted(sorted_files, key=lambda x: x['size'], reverse=True)[:args.m]
        # Re-sort by date for display
        sorted_files = sorted(sorted_files, key=lambda x: x['date'])

    total_size = sum(file['size'] for file in sorted_files)

    print("File Information:")
    print("----------------------------------------------------------------------------------------")
    print("{:<50} {:<20} {:<15} {:<10}".format("Path", "Date", "Size", "% of Total"))
    print("----------------------------------------------------------------------------------------")

    for file in sorted_files:
        filepath = file['path']
        date = file['date']
        size = file['size']
        percentage = (size / total_size * 100) if total_size > 0 else 0
        formatted_size = format_size(size)
        print("{:<50} {:<20} {:<15} {:.1f}%".format(
            filepath, date, formatted_size, percentage))

    print("----------------------------------------------------------------------------------------")
    if args.m:
        print(f"Total size of {len(sorted_files)} largest files: {format_size(total_size)}")
    else:
        print(f"Total size: {format_size(total_size)} ({len(sorted_files)} files)")

if __name__ == "__main__":
    main()