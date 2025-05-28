import { MigrationInterface, QueryRunner } from "typeorm";

export class NombreDescriptivoDeTuMigracion1748278092109 implements MigrationInterface {
    name = 'NombreDescriptivoDeTuMigracion1748278092109'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "submissions" DROP CONSTRAINT "FK_8723840b9b0464206640c268abc"`);
        await queryRunner.query(`ALTER TABLE "submissions" DROP CONSTRAINT "FK_435def3bbd4b4bbb9de1209cdae"`);
        await queryRunner.query(`ALTER TABLE "submissions" DROP CONSTRAINT "UQ_f043d0d459a667e9396e2a90864"`);
        await queryRunner.query(`ALTER TABLE "submissions" DROP COLUMN "submission_file_url"`);
        await queryRunner.query(`ALTER TABLE "submissions" DROP COLUMN "submission_message"`);
        await queryRunner.query(`ALTER TABLE "submissions" DROP COLUMN "submitted_at"`);
        await queryRunner.query(`ALTER TABLE "submissions" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "submissions" DROP COLUMN "assignment_id"`);
        await queryRunner.query(`ALTER TABLE "submissions" DROP COLUMN "student_id"`);
        await queryRunner.query(`ALTER TABLE "submissions" ADD "assignmentId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "submissions" ADD "studentId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "submissions" ADD "filePath" character varying`);
        await queryRunner.query(`ALTER TABLE "submissions" ADD "submissionDate" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`ALTER TABLE "submissions" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "submissions" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "submissions" DROP COLUMN "grade"`);
        await queryRunner.query(`ALTER TABLE "submissions" ADD "grade" integer`);
        await queryRunner.query(`ALTER TABLE "submissions" ADD CONSTRAINT "FK_c2611c601f49945ceff5c0909a2" FOREIGN KEY ("assignmentId") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "submissions" ADD CONSTRAINT "FK_4fc99318a291abd7e2a50f50851" FOREIGN KEY ("studentId") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "submissions" DROP CONSTRAINT "FK_4fc99318a291abd7e2a50f50851"`);
        await queryRunner.query(`ALTER TABLE "submissions" DROP CONSTRAINT "FK_c2611c601f49945ceff5c0909a2"`);
        await queryRunner.query(`ALTER TABLE "submissions" DROP COLUMN "grade"`);
        await queryRunner.query(`ALTER TABLE "submissions" ADD "grade" numeric(5,2)`);
        await queryRunner.query(`ALTER TABLE "submissions" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "submissions" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "submissions" DROP COLUMN "submissionDate"`);
        await queryRunner.query(`ALTER TABLE "submissions" DROP COLUMN "filePath"`);
        await queryRunner.query(`ALTER TABLE "submissions" DROP COLUMN "studentId"`);
        await queryRunner.query(`ALTER TABLE "submissions" DROP COLUMN "assignmentId"`);
        await queryRunner.query(`ALTER TABLE "submissions" ADD "student_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "submissions" ADD "assignment_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "submissions" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "submissions" ADD "submitted_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "submissions" ADD "submission_message" text`);
        await queryRunner.query(`ALTER TABLE "submissions" ADD "submission_file_url" text`);
        await queryRunner.query(`ALTER TABLE "submissions" ADD CONSTRAINT "UQ_f043d0d459a667e9396e2a90864" UNIQUE ("assignment_id", "student_id")`);
        await queryRunner.query(`ALTER TABLE "submissions" ADD CONSTRAINT "FK_435def3bbd4b4bbb9de1209cdae" FOREIGN KEY ("student_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "submissions" ADD CONSTRAINT "FK_8723840b9b0464206640c268abc" FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
