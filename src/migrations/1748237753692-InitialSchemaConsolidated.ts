import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchemaConsolidated1748237753692 implements MigrationInterface {
    name = 'InitialSchemaConsolidated1748237753692'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."messages_room_type_enum" AS ENUM('class', 'direct')`);
        await queryRunner.query(`CREATE TABLE "messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "content" text NOT NULL, "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "sender_id" uuid NOT NULL, "room_id" character varying(255) NOT NULL, "room_type" "public"."messages_room_type_enum" NOT NULL, "class_id" uuid, "recipient_id" uuid, CONSTRAINT "PK_18325f38ae6de43878487eff986" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "announcements" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(200) NOT NULL, "content" text NOT NULL, "image_url" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "author_id" uuid, "class_id" uuid NOT NULL, CONSTRAINT "PK_b3ad760876ff2e19d58e05dc8b0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "submissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "submission_file_url" text, "submission_message" text, "grade" numeric(5,2), "feedback" text, "submitted_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "assignment_id" uuid NOT NULL, "student_id" uuid NOT NULL, CONSTRAINT "UQ_f043d0d459a667e9396e2a90864" UNIQUE ("assignment_id", "student_id"), CONSTRAINT "PK_10b3be95b8b2fb1e482e07d706b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "assignments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(255) NOT NULL, "description" text, "dueDate" TIMESTAMP WITH TIME ZONE, "class_id" uuid NOT NULL, "teacher_id" uuid, "assignment_file_url" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_c54ca359535e0012b04dcbd80ee" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "classes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(150) NOT NULL, "description" text, "class_code" character varying(20) NOT NULL, "teacher_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_1c7a37d4b45c2664db574869ff8" UNIQUE ("class_code"), CONSTRAINT "UQ_1c7a37d4b45c2664db574869ff8" UNIQUE ("class_code"), CONSTRAINT "PK_e207aa15404e9b2ce35910f9f7f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "class_enrollments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "class_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_94401876d965cc28d5ed0ab3693" UNIQUE ("user_id", "class_id"), CONSTRAINT "PK_ebe374c2bfa4dbc289401ef5496" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "usuarios" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "password" character varying NOT NULL, "firstName" character varying(100), "lastName" character varying(100), "picture_url" text, "roles" text array NOT NULL DEFAULT '{}', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_446adfc18b35418aac32ae0b7b5" UNIQUE ("email"), CONSTRAINT "PK_d7281c63c176e152e4c531594a8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_22133395bd13b970ccd0c34ab22" FOREIGN KEY ("sender_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_f08ac7df6d646ce3ea32770f00f" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_566c3d68184e83d4307b86f85ab" FOREIGN KEY ("recipient_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "announcements" ADD CONSTRAINT "FK_0a13cf0aa1f1a2666699ff473f0" FOREIGN KEY ("author_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "announcements" ADD CONSTRAINT "FK_8adc55f739d19d84f29e5ffcfb4" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "submissions" ADD CONSTRAINT "FK_8723840b9b0464206640c268abc" FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "submissions" ADD CONSTRAINT "FK_435def3bbd4b4bbb9de1209cdae" FOREIGN KEY ("student_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "assignments" ADD CONSTRAINT "FK_951fd419e8486c10ba6302a934b" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "assignments" ADD CONSTRAINT "FK_27322fa090b5deacc5785fcb94c" FOREIGN KEY ("teacher_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "classes" ADD CONSTRAINT "FK_b34c92e413c4debb6e0f23fed46" FOREIGN KEY ("teacher_id") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "class_enrollments" ADD CONSTRAINT "FK_3e55346a50b96acf9006b4e8f15" FOREIGN KEY ("user_id") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "class_enrollments" ADD CONSTRAINT "FK_dfd6aaba34336d3c77b06c5038c" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "class_enrollments" DROP CONSTRAINT "FK_dfd6aaba34336d3c77b06c5038c"`);
        await queryRunner.query(`ALTER TABLE "class_enrollments" DROP CONSTRAINT "FK_3e55346a50b96acf9006b4e8f15"`);
        await queryRunner.query(`ALTER TABLE "classes" DROP CONSTRAINT "FK_b34c92e413c4debb6e0f23fed46"`);
        await queryRunner.query(`ALTER TABLE "assignments" DROP CONSTRAINT "FK_27322fa090b5deacc5785fcb94c"`);
        await queryRunner.query(`ALTER TABLE "assignments" DROP CONSTRAINT "FK_951fd419e8486c10ba6302a934b"`);
        await queryRunner.query(`ALTER TABLE "submissions" DROP CONSTRAINT "FK_435def3bbd4b4bbb9de1209cdae"`);
        await queryRunner.query(`ALTER TABLE "submissions" DROP CONSTRAINT "FK_8723840b9b0464206640c268abc"`);
        await queryRunner.query(`ALTER TABLE "announcements" DROP CONSTRAINT "FK_8adc55f739d19d84f29e5ffcfb4"`);
        await queryRunner.query(`ALTER TABLE "announcements" DROP CONSTRAINT "FK_0a13cf0aa1f1a2666699ff473f0"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_566c3d68184e83d4307b86f85ab"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_f08ac7df6d646ce3ea32770f00f"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_22133395bd13b970ccd0c34ab22"`);
        await queryRunner.query(`DROP TABLE "usuarios"`);
        await queryRunner.query(`DROP TABLE "class_enrollments"`);
        await queryRunner.query(`DROP TABLE "classes"`);
        await queryRunner.query(`DROP TABLE "assignments"`);
        await queryRunner.query(`DROP TABLE "submissions"`);
        await queryRunner.query(`DROP TABLE "announcements"`);
        await queryRunner.query(`DROP TABLE "messages"`);
        await queryRunner.query(`DROP TYPE "public"."messages_room_type_enum"`);
    }

}
