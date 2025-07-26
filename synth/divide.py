import sys
import os
from bisect import bisect_left

def split_file_by_lines(file_path: str, num_parts: int):
    """
    Divides a file into a specified number of parts based on character count,
    rounding to the nearest line. If equally distant, it rounds up to the
    uppermost line.

    Args:
        file_path (str): The path to the input file.
        num_parts (int): The number of parts to divide the file into.
    """

    if not os.path.exists(file_path):
        print(f"Error: File not found at '{file_path}'")
        sys.exit(1)

    if not isinstance(num_parts, int) or num_parts <= 0:
        print("Error: Number of parts must be a positive integer.")
        sys.exit(1)

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
    except Exception as e:
        print(f"Error reading file: {e}")
        sys.exit(1)

    if not lines:
        print(f"Warning: The file '{file_path}' is empty. Creating {num_parts} empty files.")
        for i in range(num_parts):
            output_file_name = f"{os.path.basename(file_path)}.part{i + 1:03d}"
            try:
                with open(output_file_name, "w", encoding="utf-8") as out_f:
                    pass
            except Exception as e:
                print(f"Error creating empty output file '{output_file_name}': {e}")
                sys.exit(1)
        return

    # Calculate cumulative character lengths for each line end
    # cumulative_lengths[i] stores the total characters up to and including line i
    cumulative_lengths = []
    current_char_count = 0
    for line in lines:
        current_char_count += len(line)
        cumulative_lengths.append(current_char_count)

    total_chars = cumulative_lengths[-1]

    # Determine split points (index of the last line for each part)
    split_indices = []
    for i in range(1, num_parts):
        target_char_val = i * (total_chars / num_parts)

        # Find the line index whose cumulative length is closest to the target
        # Handles rounding up on tie
        pos = bisect_left(cumulative_lengths, target_char_val)

        if pos == 0:
            # Target is before or at the first line
            split_idx = 0
        elif pos == len(cumulative_lengths):
            # Target is beyond the last line (shouldn't happen for i < num_parts)
            split_idx = len(cumulative_lengths) - 1
        else:
            val_1 = cumulative_lengths[pos]      # Value at or just after target
            val_2 = cumulative_lengths[pos - 1]  # Value just before target

            diff_1 = abs(val_1 - target_char_val)
            diff_2 = abs(val_2 - target_char_val)

            if diff_1 < diff_2:
                split_idx = pos
            elif diff_2 < diff_1:
                split_idx = pos - 1
            else:  # diff_1 == diff_2, round up to the uppermost line
                split_idx = pos
        
        # Ensure that split indices are monotonically increasing
        # This can happen if target_char_val is very close for subsequent parts
        # e.g., if total_chars is small and num_parts is large.
        if split_indices and split_idx <= split_indices[-1]:
            # Try to increment the split index if possible, otherwise use existing
            if split_indices[-1] + 1 < len(lines):
                 split_idx = split_indices[-1] + 1
            else: # Cannot increment further, might lead to empty files
                split_idx = split_indices[-1] # Fallback
                
        split_indices.append(split_idx)
    
    # Remove duplicate split points if any were forced to be the same, 
    # and ensure unique, sorted indices
    split_indices = sorted(list(set(split_indices)))

    # Distribute lines into parts
    part_starts = [0] + [idx + 1 for idx in split_indices]
    part_ends = split_indices + [len(lines) - 1] # Last line for the final part

    # Write parts to new files
    base_name = os.path.basename(file_path)

    start_line_idx = 0
    for i in range(num_parts):
        output_file_name = f"{base_name}.part{i + 1:03d}"

        # Determine the range of lines for the current part
        end_line_idx = None
        if i < len(split_indices):
            end_line_idx = split_indices[i] + 1 # Slice goes up to, but not including, this index
        else:
            end_line_idx = len(lines) # For the last part, goes to the end of lines

        part_lines = lines[start_line_idx:end_line_idx]
        
        try:
            with open(output_file_name, "w", encoding="utf-8") as out_f:
                out_f.writelines(part_lines)
            print(f"Created '{output_file_name}' with {len(part_lines)} lines.")
        except Exception as e:
            print(f"Error writing to file '{output_file_name}': {e}")
            sys.exit(1)
        
        start_line_idx = end_line_idx


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python script.py <input_file_path> <number_of_parts>")
        sys.exit(1)

    input_file = sys.argv[1]
    try:
        num_parts_arg = int(sys.argv[2])
    except ValueError:
        print("Error: Number of parts must be an integer.")
        sys.exit(1)

    split_file_by_lines(input_file, num_parts_arg)