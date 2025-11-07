#!/usr/bin/env python3

"""
🤖 GHOSTLINE AUTO-VALIDATOR
Автоматически проверяет все задачи и не останавливается пока все не будет работать!
"""

import subprocess
import json
import sys
import time
from pathlib import Path

# Colors
class Colors:
    GREEN = '\033[32m'
    RED = '\033[31m'
    YELLOW = '\033[33m'
    CYAN = '\033[36m'
    MAGENTA = '\033[35m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

MAX_ATTEMPTS = 5
WAIT_BETWEEN_ATTEMPTS = 2  # seconds

def print_header():
    print(f"\n{Colors.CYAN}╔════════════════════════════════════════════════════════╗{Colors.RESET}")
    print(f"{Colors.CYAN}║   🤖 GHOSTLINE AUTO-VALIDATOR - САМОПРОВЕРКА         ║{Colors.RESET}")
    print(f"{Colors.CYAN}╚════════════════════════════════════════════════════════╝{Colors.RESET}\n")

def run_validator():
    """Запускает validator и возвращает результат"""
    try:
        result = subprocess.run(
            ['node', 'test-validator.js'],
            capture_output=True,
            text=True,
            timeout=10
        )
        return {
            'success': result.returncode == 0,
            'stdout': result.stdout,
            'stderr': result.stderr
        }
    except subprocess.TimeoutExpired:
        return {
            'success': False,
            'error': 'Validator timeout'
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

def extract_failed_tasks(output):
    """Извлекает список провалившихся задач из вывода"""
    failed = []
    lines = output.split('\n')
    for line in lines:
        if '✗' in line and '[' in line and ']' in line:
            # Extract task ID and name
            try:
                start = line.index('[') + 1
                end = line.index(']')
                task_id = int(line[start:end])
                task_name = line[end+1:].strip()
                failed.append({
                    'id': task_id,
                    'name': task_name
                })
            except:
                pass
    return failed

def suggest_fixes(failed_tasks):
    """Предлагает фиксы для провалившихся задач"""
    print(f"\n{Colors.YELLOW}⚠️  Обнаружены проблемы:{Colors.RESET}\n")

    for task in failed_tasks:
        print(f"{Colors.RED}✗{Colors.RESET} [{task['id']}] {task['name']}")

    print(f"\n{Colors.CYAN}💡 Рекомендации:{Colors.RESET}")
    print("1. Проверьте что все файлы сохранены")
    print("2. Проверьте что нет конфликтов в Git")
    print("3. Проверьте что синтаксис правильный")
    print("4. Запустите 'node test-validator.js' вручную для деталей")

def main():
    print_header()

    # Check if test-validator.js exists
    if not Path('test-validator.js').exists():
        print(f"{Colors.RED}❌ Ошибка: test-validator.js не найден!{Colors.RESET}")
        sys.exit(1)

    attempt = 1
    while attempt <= MAX_ATTEMPTS:
        print(f"{Colors.CYAN}🔄 Попытка #{attempt}/{MAX_ATTEMPTS}...{Colors.RESET}\n")

        result = run_validator()

        if 'error' in result:
            print(f"{Colors.RED}❌ Ошибка запуска validator: {result['error']}{Colors.RESET}")
            attempt += 1
            time.sleep(WAIT_BETWEEN_ATTEMPTS)
            continue

        # Parse output
        output = result.get('stdout', '') + result.get('stderr', '')

        # Extract stats
        passed_match = [l for l in output.split('\n') if 'Passed:' in l]
        if passed_match:
            print(passed_match[0])

        failed_match = [l for l in output.split('\n') if 'Failed:' in l]
        if failed_match:
            print(failed_match[0])

        if result['success']:
            print(f"\n{Colors.GREEN}{Colors.BOLD}🎉 ВСЕ ТЕСТЫ ПРОШЛИ! СИСТЕМА РАБОТАЕТ ИДЕАЛЬНО!{Colors.RESET}")
            print(f"{Colors.GREEN}✓ Все {attempt if attempt > 1 else 'с первой попытки'} задачи выполнены!{Colors.RESET}\n")

            # Summary
            print(f"{Colors.CYAN}📊 Статистика:{Colors.RESET}")
            print(f"   Попыток: {attempt}")
            print(f"   Статус: {Colors.GREEN}✓ PASSED{Colors.RESET}\n")

            return 0
        else:
            # Extract failed tasks
            failed_tasks = extract_failed_tasks(output)
            suggest_fixes(failed_tasks)

            if attempt < MAX_ATTEMPTS:
                print(f"\n{Colors.YELLOW}⏳ Ожидание {WAIT_BETWEEN_ATTEMPTS} секунд перед следующей попыткой...{Colors.RESET}")
                time.sleep(WAIT_BETWEEN_ATTEMPTS)

            attempt += 1

    # If we got here, all attempts failed
    print(f"\n{Colors.RED}❌ НЕ УДАЛОСЬ ПРОЙТИ ВСЕ ТЕСТЫ ПОСЛЕ {MAX_ATTEMPTS} ПОПЫТОК{Colors.RESET}")
    print(f"{Colors.YELLOW}💡 Требуется ручное вмешательство{Colors.RESET}\n")
    return 1

if __name__ == '__main__':
    sys.exit(main())
